import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runAdvisor, runWeeklyScript, runMonthlyScript } from '@/lib/pf-financial-context'

const WEEKLY_TTL_MS  = 7  * 24 * 60 * 60 * 1000 // 7 dias
const MONTHLY_TTL_MS = 28 * 24 * 60 * 60 * 1000 // 28 dias

async function autoGenerateScripts() {
  const now = new Date()

  const { data: scripts } = await supabaseAdmin
    .from('pf_advisor_scripts')
    .select('type,generated_at')

  const weekly  = scripts?.find(s => s.type === 'weekly')
  const monthly = scripts?.find(s => s.type === 'monthly')

  const weeklyStale  = !weekly  || (now.getTime() - new Date(weekly.generated_at).getTime()  > WEEKLY_TTL_MS)
  const monthlyStale = !monthly || (now.getTime() - new Date(monthly.generated_at).getTime() > MONTHLY_TTL_MS)

  const tasks: Promise<any>[] = []

  if (weeklyStale) {
    tasks.push(
      runWeeklyScript().then(script =>
        supabaseAdmin.from('pf_advisor_scripts').upsert({ type: 'weekly', script, generated_at: now.toISOString() })
      ).catch(() => { /* silencioso — não bloqueia o refresh principal */ })
    )
  }

  if (monthlyStale) {
    tasks.push(
      runMonthlyScript().then(script =>
        supabaseAdmin.from('pf_advisor_scripts').upsert({ type: 'monthly', script, generated_at: now.toISOString() })
      ).catch(() => {})
    )
  }

  if (tasks.length) await Promise.all(tasks)
}

// POST — roda o consultor, salva no cache, gera notificações e auto-atualiza scripts
export async function POST() {
  try {
    const [advices] = await Promise.all([
      runAdvisor(),
      autoGenerateScripts(),
    ])

    await supabaseAdmin.from('pf_advisor_cache').upsert({
      id: 1,
      advices,
      generated_at: new Date().toISOString(),
    })

    // Notificações apenas para alta prioridade (máx 3)
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

// GET — lê o cache atual (instantâneo)
export async function GET() {
  const { data } = await supabaseAdmin
    .from('pf_advisor_cache')
    .select('*')
    .eq('id', 1)
    .single()
  return NextResponse.json(data ?? { advices: [], generated_at: null })
}
