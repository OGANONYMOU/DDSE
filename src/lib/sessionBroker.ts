import { appConfig, assertAppConfig } from './config';

function brokerUrl(path: string) {
  const config = assertAppConfig();
  return new URL(path, `${config.convexSiteUrl}/`).toString();
}

export async function brokerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(brokerUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? 'Secure session request failed.');
  }

  return response.status === 204 ? (undefined as T) : (await response.json()) as T;
}

export async function brokerRpc<T>(operation: string, payload?: Record<string, unknown>): Promise<T> {
  return brokerFetch<T>('/api/rpc', {
    method: 'POST',
    body: JSON.stringify({ operation, payload }),
  });
}

export { appConfig };
