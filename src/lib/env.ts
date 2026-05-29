// Runtime environment validation. Called once at startup.
// Throws clearly if a required VITE_ variable is missing so the
// problem surfaces immediately rather than as a cryptic runtime failure.

export interface AppEnv {
  supabaseUrl:     string;
  supabaseAnonKey: string;
  appVersion:      string;
  isDev:           boolean;
  isProd:          boolean;
}

function requireVar(name: string): string {
  const value = import.meta.env[name];
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `[DDSE] Missing required environment variable: ${name}.\n` +
      `Create a .env.local file with your Supabase credentials.\n` +
      `See .env.example for the expected format.`
    );
  }
  return value.trim();
}

function loadEnv(): AppEnv {
  // These vars are required for the app to function.
  // In CI / build environments they must be provided as secrets.
  const supabaseUrl     = requireVar('VITE_SUPABASE_URL');
  const supabaseAnonKey = requireVar('VITE_SUPABASE_ANON_KEY');

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(`[DDSE] VITE_SUPABASE_URL is not a valid URL: "${supabaseUrl}"`);
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    appVersion: import.meta.env.VITE_APP_VERSION ?? '2.5.0',
    isDev:      import.meta.env.DEV  === true,
    isProd:     import.meta.env.PROD === true,
  };
}

// Exported singleton — validated once, read everywhere.
// The `supabaseMisconfigured` flag in supabase.ts takes precedence for
// graceful degradation; this module is for hard-fail validation.
let _env: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!_env) {
    _env = loadEnv();
  }
  return _env;
}

// Returns true if all required vars are present (non-throwing check).
export function isEnvValid(): boolean {
  try {
    loadEnv();
    return true;
  } catch {
    return false;
  }
}
