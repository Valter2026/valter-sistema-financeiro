import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const url   = new URL(req.url)
  const today = new Date()
  const year  = parseInt(url.searchParams.get('year') ?? String(today.getFullYear()))
  const start = `${year}-01-01`
  const end   = `${year}-12-31`

  const [{ data: txs }, { data: accounts }] = await Promise.all([
    supabaseAdmin
      .from('fin_transactions')
      .select('type,amount,status,date')
      .gte('date', start)
      .lte('date', end),
    supabaseAdmin
      .from('fin_accounts')
      .select('opening_balance')
      .in('type', ['checking','savings','cash'])
      .eq('active', true),
  ])

  const saldoInicial = (accounts ?? []).reduce((a, acc) => a + Number(acc.opening_balance ?? 0), 0)

  // Agrupa por mês
  const meses: Record<string, { receitas: number; despesas: number; projetado_rec: number; projetado_desp: number }> = {}
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2,'0')}`
    meses[key] = { receitas: 0, despesas: 0, projetado_rec: 0, projetado_desp: 0 }
  }

  for (const t of txs ?? []) {
    const key = t.date.substring(0, 7)
    if (!meses[key]) continue
    const confirmed = t.status === 'confirmed' || t.status === 'reconciled'
    if (t.type === 'income') {
      if (confirmed) meses[key].receitas   += Number(t.amount)
      else           meses[key].projetado_rec += Number(t.amount)
    }
    if (t.type === 'expense') {
      if (confirmed) meses[key].despesas    += Number(t.amount)
      else           meses[key].projetado_desp += Number(t.amount)
    }
  }

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  let saldoAcum = saldoInicial
  const fluxo = Object.entries(meses).map(([key, v], i) => {
    const resultado = v.receitas - v.despesas
    saldoAcum += resultado
    return {
      mes:       key,
      label:     MESES[i],
      receitas:  +v.receitas.toFixed(2),
      despesas:  +v.despesas.toFixed(2),
      resultado: +resultado.toFixed(2),
      saldo:     +saldoAcum.toFixed(2),
      projetado_rec:  +v.projetado_rec.toFixed(2),
      projetado_desp: +v.projetado_desp.toFixed(2),
    }
  })

  return NextResponse.json({ year, fluxo, saldoInicial: +saldoInicial.toFixed(2) })
}
