import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { PlatformUser } from '../types/platform';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required for Supabase authentication.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function serviceNumberToEmail(serviceNumber: string) {
  return `${serviceNumber}@ddse.local`;
}

export function toPlatformUser(user: User | null): PlatformUser | null {
  if (!user) return null;
  const metadata = (user.user_metadata ?? {}) as Record<string, any>;

  return {
    id: user.id,
    fullName: metadata.fullName || metadata.full_name || '',
    serviceNumber: metadata.serviceNumber || user.email?.split('@')[0] || '',
    roleCode: metadata.roleCode || 'base_soldier',
    directorateCode: metadata.directorateCode || metadata.directorate || '',
    status: metadata.status || 'active',
    mfaRequired: metadata.mfaRequired ?? false,
    mfaEnrolled: metadata.mfaEnrolled ?? false,
    mustChangePassword: metadata.mustChangePassword ?? false,
    isPlatformOwner: metadata.isPlatformOwner ?? false,
  };
}

export function sessionExpiresAt(session: Session | null | undefined) {
  if (!session?.expires_at) {
    return Date.now() + 60 * 60 * 1000;
  }
  return session.expires_at * 1000;
}
