import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (adminKey) {
    return createClient(url!, adminKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in production');
  }

  return supabase;
}
