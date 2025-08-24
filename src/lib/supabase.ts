import { createClient } from '@supabase/supabase-js';

// Only load .env.local if we're running as a script (not in Next.js)
if (!process.env.NEXT_RUNTIME) {
  const { config } = require('dotenv');
  config({ path: '.env.local' });
}


if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
