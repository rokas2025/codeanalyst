/**
 * Supabase Client Configuration (Frontend)
 * Uses anon key for client-side operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Missing Supabase environment variables')
  console.warn('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase auth')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

if (supabase) {
  console.log('✅ Supabase client initialized')
}

