import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { PlatformUser } from '../types/platform';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseMisconfigured = !supabaseUrl || !supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export function serviceNumberToEmail(serviceNumber: string) {
  return `${serviceNumber.trim().toLowerCase()}@ddse.local`;
}

export function toPlatformUser(user: User | null): PlatformUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  return {
    id:                 user.id,
    fullName:           String(meta.fullName          ?? meta.full_name ?? ''),
    email:              String(meta.email             ?? ''),
    serviceNumber:      String(meta.serviceNumber     ?? user.email?.split('@')[0] ?? ''),
    rankCode:           String(meta.rankCode          ?? ''),
    roleCode:           String(meta.roleCode          ?? 'staff'),
    directorateCode:    String(meta.directorateCode   ?? meta.directorate ?? ''),
    status:             String(meta.status            ?? 'active'),
    mfaRequired:        Boolean(meta.mfaRequired      ?? false),
    mfaEnrolled:        Boolean(meta.mfaEnrolled      ?? false),
    mustChangePassword: Boolean(meta.mustChangePassword ?? false),
    isPlatformOwner:    Boolean(meta.isPlatformOwner  ?? false),
  };
}

export function sessionExpiresAt(session: Session | null | undefined) {
  if (!session?.expires_at) return Date.now() + 60 * 60 * 1000;
  return session.expires_at * 1000;
}
