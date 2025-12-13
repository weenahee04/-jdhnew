// Supabase client helper
// Use this in API routes (server-side only)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service_role key (for server-side operations)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// For client-side use (if needed in the future)
export const createSupabaseClient = (anonKey: string) => {
  return createClient(supabaseUrl, anonKey);
};

