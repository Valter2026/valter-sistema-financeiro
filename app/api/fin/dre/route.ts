import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const url   = new URL(req.url)
  const today = new Date()
  const year  = parseInt(url.searchParams.get('year') ?? String(today.getFullYear()))
  const start = `${year}-01-01`
  const end   = `${year}-12-31`

  const { data: txs, error } = await supabaseAdmin
    .from('fin_transactions')
    .select('type,amount,status,date,category:fin_categories(id,name,type,parent_id)')
    .gte('date', start)
    .lte('date', end)
    .in('status', ['confirmed','reconciled'])
    .in('type', ['income','expense'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  // Agrupa por mês
  const meses: Record<string, { receitas: number; despesas: number }> = {}
  for (let m = 1; m <= 12; m++) {
    meses[`${year}-${String(m).padStart(2,'0')}`] = { receitas: 0, despesas: 0 }
  }

  // Por categoria
  const porCategoria: Record<string, { nome: string; tipo: string; total: number }> = {}

  for (const t of txs ?? []) {
    const key = t.date.substring(0, 7)
    const amt = Number(t.amount)
    if (t.type === 'income')  { meses[key].receitas  += amt }
    if (t.type === 'expense') { meses[key].despesas += amt }

    const cat = t.category as any
    if (cat) {
      if (!porCategoria[cat.id]) porCategoria[cat.id] = { nome: cat.name, tipo: cat.type, total: 0 }
      porCategoria[cat.id].total += amt
    }
  }

  const totalReceitas = Object.values(meses).reduce((a, m) => a + m.receitas, 0)
  const totalDespesas = Object.values(meses).reduce((a, m) => a + m.despesas, 0)
  const resultado     = totalReceitas - totalDespesas
  const margem        = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0

  const evolucao = Object.entries(meses).map(([key, v], i) => ({
    mes:       key,
    label:     MESES[i],
    receitas:  +v.receitas.toFixed(2),
    despesas:  +v.despesas.toFixed(2),
    resultado: +(v.receitas - v.despesas).toFixed(2),
  }))

  const categorias = Object.values(porCategoria)
    .sort((a, b) => b.total - a.total)
    .map(c => ({ ...c, total: +c.total.toFixed(2) }))

  return NextResponse.json({
    year,
    totalReceitas: +totalReceitas.toFixed(2),
    totalDespesas: +totalDespesas.toFixed(2),
    resultado:     +resultado.toFixed(2),
    margem:        +margem.toFixed(1),
    evolucao,
    categorias,
  })
}
