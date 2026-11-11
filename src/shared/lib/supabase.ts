import { createClient } from '@supabase/supabase-js';
import { authConfigured, env } from '@/shared/config/env';
export const supabase = authConfigured
  ? createClient(env.supabaseUrl!, env.supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
 