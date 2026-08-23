import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if a valid HTTP/HTTPS URL is provided
export const isValidSupabaseUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.startsWith('placeholder') || trimmed.includes('placeholder.supabase.co')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured =
  isValidSupabaseUrl(rawUrl) &&
  Boolean(rawAnonKey && typeof rawAnonKey === 'string' && rawAnonKey.trim() !== '' && rawAnonKey !== 'placeholder-anon-key');

// Ensure a safe valid HTTP/HTTPS URL is always passed to createClient to avoid crashing on initialization
const safeUrl = isValidSupabaseUrl(rawUrl) ? rawUrl.trim() : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? rawAnonKey.trim() : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
  },
});
