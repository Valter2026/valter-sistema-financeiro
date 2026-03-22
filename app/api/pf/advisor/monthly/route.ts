import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runMonthlyScript } from '@/lib/pf-financial-context'

// POST — gera o script mensal e salva
export async function POST() {
  try {
    const script = await runMonthlyScript()
    await supabaseAdmin.from('pf_advisor_scripts').upsert({
      type:         'monthly',
      script,
      generated_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, script })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET — lê o script salvo
export async function GET() {
  const { data } = await supabaseAdmin
    .from('pf_advisor_scripts')
    .select('*')
    .eq('type', 'monthly')
    .single()
  return NextResponse.json(data ?? { script: '', generated_at: null })
}
