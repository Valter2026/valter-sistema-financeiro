import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runFinAdvisor, runFinWeeklyScript, runFinMonthlyScript } from '@/lib/fin-financial-context'

const WEEKLY_TTL_MS  = 7  * 24 * 60 * 60 * 1000
const MONTHLY_TTL_MS = 28 * 24 * 60 * 60 * 1000

export async function GET() {
  const { supabase } = await requireAuth()
  const { data: cache } = await supabase
    .from('fin_advisor_cache').select('advices,generated_at').eq('id', 1).single()
  return NextResponse.json({ advices: cache?.advices ?? [], generated_at: cache?.generated_at ?? null })
}

export async function POST() {
  const { supabase } = await requireAuth()
  // Check preferences
  const { data: sched } = await supabase
    .from('fin_advisor_schedule').select('*').eq('id', 1).single()
  const enabled          = sched?.enabled          ?? true
  const receiveMessages  = sched?.receive_messages ?? true
  const receiveAudio     = sched?.receive_audio    ?? true

  if (!enabled) return NextResponse.json({ ok: false, reason: 'disabled' })

  let advices: any[] = []

  if (receiveMessages) {
    try {
      advices = await runFinAdvisor()
      await supabase.from('fin_advisor_cache')
        .upsert({ id: 1, advices, generated_at: new Date().toISOString() })

      // Create notification for high-priority alerts
      const alerts = advices.filter((a: any) => a.type === 'alert' || a.priority === 'high').slice(0, 2)
      for (const a of alerts) {
        await supabase.from('fin_notifications').insert({
          type: 'advisor', title: a.title, message: a.message, action_text: a.action,
        })
      }
    } catch (e: any) {
      console.error('fin advisor error:', e)
    }
  }

  if (receiveAudio) {
    const now = new Date()
    // Weekly script
    const { data: wk } = await supabase
      .from('fin_advisor_scripts').select('generated_at').eq('type', 'weekly').single()
    if (!wk || (now.getTime() - new Date(wk.generated_at).getTime()) > WEEKLY_TTL_MS) {
      try {
        const script = await runFinWeeklyScript()
        await supabase.from('fin_advisor_scripts')
          .upsert({ type: 'weekly', script, generated_at: now.toISOString() })
      } catch {}
    }
    // Monthly script
    const { data: mo } = await supabase
      .from('fin_advisor_scripts').select('generated_at').eq('type', 'monthly').single()
    if (!mo || (now.getTime() - new Date(mo.generated_at).getTime()) > MONTHLY_TTL_MS) {
      try {
        const script = await runFinMonthlyScript()
        await supabase.from('fin_advisor_scripts')
          .upsert({ type: 'monthly', script, generated_at: now.toISOString() })
      } catch {}
    }
  }

  return NextResponse.json({ ok: true, count: advices.length })
}
