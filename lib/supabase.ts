// Supabase client helper
// Use this in API routes (server-side only)

import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid errors during module load
let _supabase: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (_supabase) {
    return _supabase;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  _supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabase;
};

// Export for backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

// For client-side use (if needed in the future)
export const createSupabaseClient = (anonKey: string) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  return createClient(supabaseUrl, anonKey);
};

