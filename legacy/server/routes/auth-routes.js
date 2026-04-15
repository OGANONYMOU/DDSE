import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { writeAuditLog } from '../middleware/audit.js';
import { requireAuth } from '../middleware/auth.js';
import { findUserById } from '../repositories/auth-repository.js';
import { authenticateUser, rotateRefreshToken } from '../services/auth-service.js';

const loginSchema = z.object({
  appointmentNumber: z.string().min(3),
  password: z.string().min(12),
  otpCode: z.string().trim().length(6).optional().nullable(),
});

export const authRouter = Router();

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
    path: '/',
  };
}

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const authResult = await authenticateUser({
      appointmentNumber: payload.appointmentNumber,
      password: payload.password,
      otpCode: payload.otpCode,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
    });

    if (authResult.requiresTwoFactor) {
      return res.status(202).json({
        requiresTwoFactor: true,
        user: authResult.user,
      });
    }

    res.cookie('ddse_access_token', authResult.accessToken, cookieOptions());
    res.cookie('ddse_refresh_token', authResult.refreshToken, cookieOptions());

    await writeAuditLog({
      actorUserId: authResult.user.id,
      actorRole: authResult.user.role,
      action: 'auth.login.success',
      entityType: 'user',
      entityId: authResult.user.id,
      correlationId: req.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return res.status(200).json({
      requiresTwoFactor: false,
      user: authResult.user,
      accessToken: authResult.accessToken,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.ddse_refresh_token;
    if (!refreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 401;
      throw error;
    }

    const authResult = await rotateRefreshToken(
      refreshToken,
      req.headers['user-agent'] ?? null,
      req.ip ?? null,
    );

    res.cookie('ddse_access_token', authResult.accessToken, cookieOptions());
    res.cookie('ddse_refresh_token', authResult.refreshToken, cookieOptions());

    res.status(200).json({
      accessToken: authResult.accessToken,
      user: authResult.user,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    res.clearCookie('ddse_access_token', { path: '/' });
    res.clearCookie('ddse_refresh_token', { path: '/' });

    await writeAuditLog({
      actorUserId: req.auth.sub,
      actorRole: req.auth.role,
      action: 'auth.logout',
      entityType: 'user',
      entityId: req.auth.sub,
      correlationId: req.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.auth.sub);
    if (!user) {
      const error = new Error('User record not found.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        appointmentNumber: user.appointment_number,
        role: user.role_code,
        directorateName: user.directorate_name,
        unitName: user.unit_name,
        formationName: user.formation_name,
        mfaRequired: user.mfa_required,
      },
    });
  } catch (error) {
    next(error);
  }
});
