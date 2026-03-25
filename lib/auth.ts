import { createSupabaseServer } from './supabase'

/**
 * Verifica autenticação e retorna { user, supabase } autenticado.
 * O client Supabase retornado aplica RLS automaticamente (usa JWT do cookie).
 *
 * Uso:
 *   const { user, supabase } = await requireAuth()
 *   const { data } = await supabase.from('pf_transactions').select('*')
 *   // RLS garante que só retorna dados do user
 */
export async function requireAuth() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    throw new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return { user, supabase }
}
