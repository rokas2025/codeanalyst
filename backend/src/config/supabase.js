/**
 * Supabase Client Configuration (Backend)
 * Uses service role key for admin operations
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key on backend

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn('⚠️  Missing Supabase environment variables - Supabase Auth features will be disabled')
  logger.warn('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable email/Google auth')
}

export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

if (supabase) {
  logger.info('✅ Supabase client initialized for auth operations')
}

