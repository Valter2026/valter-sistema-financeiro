import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runAdvisor } from '@/lib/pf-financial-context'

// POST — roda o consultor, salva no cache e gera notificações in-app
export async function POST() {
  try {
    const advices = await runAdvisor()

    // Salva no cache
    await supabaseAdmin.from('pf_advisor_cache').upsert({
      id: 1,
      advices,
      generated_at: new Date().toISOString(),
    })

    // Cria notificações para orientações de alta prioridade (máx 3 por refresh)
    const urgent = advices.filter((a: any) => a.priority === 'high' || a.type === 'alert')
    for (const advice of urgent.slice(0, 3)) {
      await supabaseAdmin.from('pf_notifications').insert({
        type:        advice.type,
        title:       advice.title,
        message:     advice.message,
        action_text: advice.action,
      })
    }

    return NextResponse.json({ ok: true, count: advices.length, urgent: urgent.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET — lê o cache atual (instantâneo, sem chamar IA)
export async function GET() {
  const { data } = await supabaseAdmin
    .from('pf_advisor_cache')
    .select('*')
    .eq('id', 1)
    .single()
  return NextResponse.json(data ?? { advices: [], generated_at: null })
}
