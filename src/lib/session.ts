const SESSION_TOKEN_KEY = 'ddse_session_token';
const SESSION_EXPIRY_KEY = 'ddse_session_expiry';

export function storeSessionToken(sessionToken: string, expiresAt: number) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, String(expiresAt));
}

export function getSessionToken() {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const expiry = Number(sessionStorage.getItem(SESSION_EXPIRY_KEY) ?? 0);

  if (!token || !expiry || expiry < Date.now()) {
    clearSessionToken();
    return null;
  }

  return token;
}

export function clearSessionToken() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
}
