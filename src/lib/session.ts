const ACCESS_TOKEN_KEY = 'ddse_access_token';
const REFRESH_TOKEN_KEY = 'ddse_refresh_token';
const SESSION_EXPIRY_KEY = 'ddse_session_expiry';

export function storeSessionTokens(accessToken: string, refreshToken: string, expiresAt: number) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, String(expiresAt));
}

export function getSessionTokens() {
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresAt = Number(sessionStorage.getItem(SESSION_EXPIRY_KEY) ?? 0);

  if (!accessToken || !refreshToken || !expiresAt || expiresAt < Date.now()) {
    clearSessionTokens();
    return null;
  }

  return { accessToken, refreshToken, expiresAt };
}

export function clearSessionTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
}
