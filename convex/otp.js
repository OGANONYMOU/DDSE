import { action, mutation, query } from './_generated/server';
import { v } from 'convex/values';

const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 15 * 60 * 1000;

async function deliverWebhook(payload) {
  const webhook = process.env.OTP_DELIVERY_WEBHOOK_URL;
  if (!webhook) {
    throw new Error('OTP delivery webhook is not configured.');
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('OTP delivery provider rejected the request.');
  }
}

export const assertOtpSendAllowed = query({
  args: {
    appointmentNumber: v.optional(v.string()),
    destination: v.string(),
    purpose: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const otpEvents = await ctx.db.query('otpEvents').withIndex('by_purpose', (q) => q.eq('purpose', args.purpose)).collect();
    const relevant = otpEvents.filter(
      (event) =>
        event.destination === args.destination ||
        (args.appointmentNumber && event.appointmentNumber === args.appointmentNumber),
    );

    const recentWindow = relevant.filter((event) => now - event.createdAt <= SEND_WINDOW_MS);
    const latest = recentWindow.sort((left, right) => right.createdAt - left.createdAt)[0];

    return {
      allowed: recentWindow.length < MAX_SENDS_PER_WINDOW && (!latest || now - latest.createdAt >= RESEND_COOLDOWN_MS),
      cooldownRemainingMs: latest ? Math.max(0, RESEND_COOLDOWN_MS - (now - latest.createdAt)) : 0,
      sendCountInWindow: recentWindow.length,
    };
  },
});

export const recordOtpEvent = mutation({
  args: {
    userId: v.optional(v.id('users')),
    appointmentNumber: v.optional(v.string()),
    purpose: v.string(),
    channel: v.string(),
    destination: v.string(),
    status: v.string(),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('otpEvents', {
      userId: args.userId,
      appointmentNumber: args.appointmentNumber,
      purpose: args.purpose,
      channel: args.channel,
      destination: args.destination,
      status: args.status,
      errorCode: args.errorCode,
      createdAt: Date.now(),
    });
  },
});

export const sendOtp = action({
  args: {
    userId: v.optional(v.id('users')),
    appointmentNumber: v.optional(v.string()),
    destination: v.string(),
    channel: v.string(),
    purpose: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const rateLimit = await ctx.runQuery('otp:assertOtpSendAllowed', {
      appointmentNumber: args.appointmentNumber,
      destination: args.destination,
      purpose: args.purpose,
    });

    if (!rateLimit.allowed) {
      await ctx.runMutation('otp:recordOtpEvent', {
        userId: args.userId,
        appointmentNumber: args.appointmentNumber,
        purpose: args.purpose,
        channel: args.channel,
        destination: args.destination,
        status: 'rate_limited',
        errorCode: 'cooldown_or_quota',
      });
      throw new Error('OTP dispatch is temporarily rate-limited.');
    }

    try {
      await deliverWebhook({
        destination: args.destination,
        channel: args.channel,
        purpose: args.purpose,
        code: args.code,
      });

      await ctx.runMutation('otp:recordOtpEvent', {
        userId: args.userId,
        appointmentNumber: args.appointmentNumber,
        purpose: args.purpose,
        channel: args.channel,
        destination: args.destination,
        status: 'sent',
      });
    } catch (_error) {
      await ctx.runMutation('otp:recordOtpEvent', {
        userId: args.userId,
        appointmentNumber: args.appointmentNumber,
        purpose: args.purpose,
        channel: args.channel,
        destination: args.destination,
        status: 'failed',
        errorCode: 'provider_error',
      });
      throw new Error('OTP delivery failed. Please try again shortly.');
    }
  },
});
