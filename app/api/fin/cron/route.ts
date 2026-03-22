import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runFinAdvisor, runFinWeeklyScript, runFinMonthlyScript } from '@/lib/fin-financial-context'

// Chamado pelo Vercel Cron diariamente às 8h (horário de Brasília = 11h UTC)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const todayWeekDay  = now.getDay()
    const todayMonthDay = now.getDate()

    const { data: schedule } = await supabaseAdmin
      .from('fin_advisor_schedule').select('*').eq('id', 1).single()

    if (!schedule?.enabled) {
      return NextResponse.json({ ok: true, skipped: 'advisor disabled' })
    }

    const tasks: { name: string; fn: () => Promise<any> }[] = []

    tasks.push({
      name: 'advisor',
      fn: async () => {
        const advices = await runFinAdvisor()
        await supabaseAdmin.from('fin_advisor_cache').upsert({
          id: 1, advices, generated_at: now.toISOString(),
        })
        if (schedule.receive_messages !== false) {
          const urgent = advices.filter((a: any) => a.priority === 'high' || a.type === 'alert')
          for (const adv of urgent.slice(0, 3)) {
            await supabaseAdmin.from('fin_notifications').insert({
              type: adv.type, title: adv.title, message: adv.message, action_text: adv.action,
            })
          }
        }
        return { advices: advices.length }
      },
    })

    if (schedule.receive_audio !== false && todayWeekDay === (schedule.weekly_day ?? 1)) {
      tasks.push({
        name: 'weekly',
        fn: async () => {
          const script = await runFinWeeklyScript()
          await supabaseAdmin.from('fin_advisor_scripts').upsert({
            type: 'weekly', script, generated_at: now.toISOString(),
          })
          if (schedule.receive_messages !== false) {
            await supabaseAdmin.from('fin_notifications').insert({
              type: 'goal',
              title: 'Briefing financeiro da semana pronto',
              message: 'O Consultor Empresarial preparou seu áudio semanal com as prioridades financeiras da semana.',
              action_text: 'Abrir Consultor e ouvir',
            })
          }
          return { weekly: true }
        },
      })
    }

    if (schedule.receive_audio !== false && todayMonthDay === (schedule.monthly_day ?? 1)) {
      tasks.push({
        name: 'monthly',
        fn: async () => {
          const script = await runFinMonthlyScript()
          await supabaseAdmin.from('fin_advisor_scripts').upsert({
            type: 'monthly', script, generated_at: now.toISOString(),
          })
          if (schedule.receive_messages !== false) {
            await supabaseAdmin.from('fin_notifications').insert({
              type: 'goal',
              title: 'Análise financeira do mês pronta',
              message: 'O Consultor Empresarial preparou sua análise mensal com DRE, margem e decisões prioritárias.',
              action_text: 'Abrir Consultor e ouvir',
            })
          }
          return { monthly: true }
        },
      })
    }

    const results: Record<string, any> = {}
    for (const task of tasks) {
      try { results[task.name] = await task.fn() }
      catch (e: any) { results[task.name] = { error: e.message } }
    }

    return NextResponse.json({ ok: true, ran: now.toISOString(), results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
