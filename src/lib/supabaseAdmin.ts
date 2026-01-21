import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    return createClient(url!, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabase;
}
