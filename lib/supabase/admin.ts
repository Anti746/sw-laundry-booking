import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client. Uses the service role key, which must NEVER be
 * exposed to the browser (no NEXT_PUBLIC_ prefix). All database access goes
 * through the API routes, so Row Level Security can block direct public access.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
