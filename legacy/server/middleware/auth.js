import { verifyAccessToken } from '../security/tokens.js';

export function requireAuth(req, _res, next) {
  try {
    const authorizationHeader = req.headers.authorization ?? '';
    const token = authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length)
      : req.cookies?.ddse_access_token;

    if (!token) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      throw error;
    }

    req.auth = verifyAccessToken(token);
    next();
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
}
