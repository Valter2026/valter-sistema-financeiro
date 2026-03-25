import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url  = process.env.SUPABASE_URL!
const anon = process.env.SUPABASE_ANON_KEY!
const svc  = process.env.SUPABASE_SERVICE_KEY!

// ── Client admin (service key) — uso restrito: cron, webhooks, migrações ──
export const supabaseAdmin = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Client server-side com sessão do usuário (App Router route handlers) ──
// Usa cookies para ler o JWT do usuário → RLS é aplicado automaticamente
export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(url, anon, {
    cookies: {
      getAll()                { return cookieStore.getAll() },
      setAll(cookiesToSet)    {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Route Handler pode não conseguir setar cookies — ignorar
        }
      },
    },
  })
}

// ── Client browser (componentes client-side) ──
export const supabase = createClient(url, anon)
