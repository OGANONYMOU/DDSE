const requiredEnv = {
  VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
  VITE_CONVEX_SITE_URL: import.meta.env.VITE_CONVEX_SITE_URL,
};

const missing = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const appConfig = {
  convexUrl: requiredEnv.VITE_CONVEX_URL ?? '',
  convexSiteUrl: requiredEnv.VITE_CONVEX_SITE_URL ?? '',
  devOtpPreview: import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_OTP_PREVIEW === 'true',
  isValid: missing.length === 0,
  missing,
};

export function assertAppConfig() {
  if (!appConfig.isValid) {
    throw new Error(`Missing required environment variables: ${appConfig.missing.join(', ')}`);
  }
  return appConfig;
}
