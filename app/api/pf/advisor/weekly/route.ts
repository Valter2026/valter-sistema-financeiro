import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runWeeklyScript } from '@/lib/pf-financial-context'

// POST — gera o script semanal e salva
export async function POST() {
  try {
    const script = await runWeeklyScript()
    await supabaseAdmin.from('pf_advisor_scripts').upsert({
      type:         'weekly',
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
    .eq('type', 'weekly')
    .single()
  return NextResponse.json(data ?? { script: '', generated_at: null })
}
