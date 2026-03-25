import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runMonthlyScript } from '@/lib/pf-financial-context'

// GET — lê o script salvo; se não existir, gera automaticamente
export async function GET() {
  const { supabase } = await requireAuth()
  const { data } = await supabase
    .from('pf_advisor_scripts')
    .select('*')
    .eq('type', 'monthly')
    .single()

  if (data?.script) return NextResponse.json(data)

  // Auto-gera se ainda não existir
  try {
    const script = await runMonthlyScript()
    await supabase.from('pf_advisor_scripts').upsert({
      type: 'monthly', script, generated_at: new Date().toISOString(),
    })
    return NextResponse.json({ type: 'monthly', script, generated_at: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ script: '', generated_at: null, error: e.message })
  }
}

// POST — força regeneração
export async function POST() {
  const { supabase } = await requireAuth()
  try {
    const script = await runMonthlyScript()
    await supabase.from('pf_advisor_scripts').upsert({
      type: 'monthly', script, generated_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, script })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
