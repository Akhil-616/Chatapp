import { createClient } from '@supabase/supabase-js';

// Primary provided credentials with environment variable overrides
const DEFAULT_SUPABASE_URL = 'https://uhulsyidhzatyuxeiejz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_YYi7fmR59z8L6dUl3VonBQ_9X4E3ckS';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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

// Ensure a safe valid HTTP/HTTPS URL is always passed to createClient
const safeUrl = isValidSupabaseUrl(rawUrl) ? rawUrl.trim() : DEFAULT_SUPABASE_URL;
const safeKey = isSupabaseConfigured ? rawAnonKey.trim() : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

