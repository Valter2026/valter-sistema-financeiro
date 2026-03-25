import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end   = searchParams.get('end')

  if (!start || !end) return NextResponse.json({ error: 'start e end obrigatórios' }, { status: 400 })

  const { data, error } = await supabase
    .from('pf_transactions')
    .select('date, type, amount, description, category:pf_categories(name,icon)')
    .gte('date', start)
    .lte('date', end)
    .eq('status', 'confirmed')
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrega por dia
  const byDay: Record<string, { date: string; receitas: number; despesas: number }> = {}
  for (const t of (data ?? [])) {
    if (!byDay[t.date]) byDay[t.date] = { date: t.date, receitas: 0, despesas: 0 }
    if (t.type === 'income')   byDay[t.date].receitas  += Number(t.amount)
    if (t.type === 'expense')  byDay[t.date].despesas  += Number(t.amount)
  }

  // Preenche todos os dias do período mesmo que sem lançamentos
  const days: { date: string; receitas: number; despesas: number; saldo: number; acumulado: number }[] = []
  const cur = new Date(start + 'T12:00:00')
  const fim = new Date(end   + 'T12:00:00')
  let acumulado = 0
  while (cur <= fim) {
    const key = cur.toISOString().split('T')[0]
    const d   = byDay[key] ?? { date: key, receitas: 0, despesas: 0 }
    const saldo = d.receitas - d.despesas
    acumulado  += saldo
    days.push({ date: key, receitas: d.receitas, despesas: d.despesas, saldo, acumulado })
    cur.setDate(cur.getDate() + 1)
  }

  const totalReceitas = days.reduce((a, d) => a + d.receitas, 0)
  const totalDespesas = days.reduce((a, d) => a + d.despesas, 0)

  return NextResponse.json({ days, totalReceitas, totalDespesas, resultado: totalReceitas - totalDespesas })
}
