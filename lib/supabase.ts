import { createClient } from '@supabase/supabase-js'

const url  = process.env.SUPABASE_URL!
const anon = process.env.SUPABASE_ANON_KEY!
const svc  = process.env.SUPABASE_SERVICE_KEY!

// Client público (leitura no browser)
export const supabase = createClient(url, anon)

// Client admin (leitura/escrita no servidor — usa service key)
export const supabaseAdmin = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false },
})
