import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runAdvisor, runWeeklyScript, runMonthlyScript } from '@/lib/pf-financial-context'

// Chamado pelo Vercel Cron diariamente às 8h (horário de Brasília = 11h UTC)
export async function GET(req: NextRequest) {
  // Proteção básica por token
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const todayWeekDay  = now.getDay()   // 0=Dom, 1=Seg...
    const todayMonthDay = now.getDate()  // 1-31

    // Lê configuração do usuário
    const { data: schedule } = await supabaseAdmin
      .from('pf_advisor_schedule')
      .select('*')
      .eq('id', 1)
      .single()

    if (!schedule?.enabled) {
      return NextResponse.json({ ok: true, skipped: 'advisor disabled' })
    }

    const tasks: { name: string; fn: () => Promise<any> }[] = []

    // Sempre atualiza o advisor principal (orientações do dia)
    tasks.push({
      name: 'advisor',
      fn: async () => {
        const advices = await runAdvisor()
        await supabaseAdmin.from('pf_advisor_cache').upsert({
          id: 1, advices, generated_at: now.toISOString(),
        })
        // Notificações apenas se receive_messages ativo
        if (schedule.receive_messages !== false) {
          const urgent = advices.filter((a: any) => a.priority === 'high' || a.type === 'alert')
          for (const adv of urgent.slice(0, 3)) {
            await supabaseAdmin.from('pf_notifications').insert({
              type: adv.type, title: adv.title, message: adv.message, action_text: adv.action,
            })
          }
        }
        return { advices: advices.length }
      },
    })

    // Áudio semanal — se receive_audio ativo e hoje é o dia configurado
    if (schedule.receive_audio !== false && todayWeekDay === (schedule.weekly_day ?? 1)) {
      tasks.push({
        name: 'weekly',
        fn: async () => {
          const script = await runWeeklyScript()
          await supabaseAdmin.from('pf_advisor_scripts').upsert({
            type: 'weekly', script, generated_at: now.toISOString(),
          })
          // Notificação in-app do áudio semanal
          if (schedule.receive_messages !== false) {
            await supabaseAdmin.from('pf_notifications').insert({
              type: 'goal',
              title: 'Sua orientação da semana está pronta',
              message: 'O Consultor IA preparou seu áudio semanal com as prioridades e ações para esta semana.',
              action_text: 'Abrir Consultor e ouvir',
            })
          }
          return { weekly: true }
        },
      })
    }

    // Áudio mensal — se receive_audio ativo e hoje é o dia configurado
    if (schedule.receive_audio !== false && todayMonthDay === (schedule.monthly_day ?? 1)) {
      tasks.push({
        name: 'monthly',
        fn: async () => {
          const script = await runMonthlyScript()
          await supabaseAdmin.from('pf_advisor_scripts').upsert({
            type: 'monthly', script, generated_at: now.toISOString(),
          })
          if (schedule.receive_messages !== false) {
            await supabaseAdmin.from('pf_notifications').insert({
              type: 'goal',
              title: 'Sua orientação do mês está pronta',
              message: 'O Consultor IA preparou seu áudio mensal com o resumo e as decisões financeiras prioritárias do mês.',
              action_text: 'Abrir Consultor e ouvir',
            })
          }
          return { monthly: true }
        },
      })
    }

    // Executa todas as tarefas
    const results: Record<string, any> = {}
    for (const task of tasks) {
      try {
        results[task.name] = await task.fn()
      } catch (e: any) {
        results[task.name] = { error: e.message }
      }
    }

    return NextResponse.json({ ok: true, ran: now.toISOString(), results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
