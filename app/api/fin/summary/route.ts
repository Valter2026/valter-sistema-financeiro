import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const url   = new URL(req.url)
  const today = new Date()
  const start = url.searchParams.get('start') ?? `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
  const end   = url.searchParams.get('end')   ?? today.toISOString().split('T')[0]

  const [{ data: txs, error: e1 }, { data: accounts, error: e2 }] = await Promise.all([
    supabaseAdmin
      .from('fin_transactions')
      .select('type,amount,status,date,account_id,to_account_id')
      .gte('date', start)
      .lte('date', end),
    supabaseAdmin.from('fin_accounts').select('*').eq('active', true),
  ])

  if (e1 || e2) return NextResponse.json({ error: e1?.message || e2?.message }, { status: 500 })

  const confirmed = (txs ?? []).filter(t => t.status === 'confirmed' || t.status === 'reconciled')
  const receitas  = confirmed.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const despesas  = confirmed.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const resultado = receitas - despesas

  // Saldo por conta (opening_balance + movimentos confirmados)
  const accMap: Record<string, number> = {}
  for (const acc of accounts ?? []) {
    accMap[acc.id] = Number(acc.opening_balance ?? 0)
  }
  for (const t of confirmed) {
    if (t.type === 'income'    && t.account_id)    accMap[t.account_id]    = (accMap[t.account_id]    ?? 0) + Number(t.amount)
    if (t.type === 'expense'   && t.account_id)    accMap[t.account_id]    = (accMap[t.account_id]    ?? 0) - Number(t.amount)
    if (t.type === 'transfer'  && t.account_id)    accMap[t.account_id]    = (accMap[t.account_id]    ?? 0) - Number(t.amount)
    if (t.type === 'transfer'  && t.to_account_id) accMap[t.to_account_id] = (accMap[t.to_account_id] ?? 0) + Number(t.amount)
  }

  // Contas a pagar/receber pendentes (sem filtro de data — todos os pendentes)
  const { data: pending } = await supabaseAdmin
    .from('fin_transactions')
    .select('type,amount,date,status')
    .in('status', ['pending', 'scheduled'])

  const aPagar   = (pending ?? []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const aReceber = (pending ?? []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const vencidos = (pending ?? []).filter(t => t.date < today.toISOString().split('T')[0] && t.type === 'expense')
  const totalVencido = vencidos.reduce((a, t) => a + Number(t.amount), 0)

  const accountsWithBalance = (accounts ?? []).map(acc => ({
    ...acc,
    balance: +(accMap[acc.id] ?? 0).toFixed(2),
  }))

  const totalAtivo = accountsWithBalance
    .filter(a => ['checking','savings','cash','investment'].includes(a.type))
    .reduce((a, acc) => a + acc.balance, 0)

  return NextResponse.json({
    periodo: { start, end },
    receitas:    +receitas.toFixed(2),
    despesas:    +despesas.toFixed(2),
    resultado:   +resultado.toFixed(2),
    aPagar:      +aPagar.toFixed(2),
    aReceber:    +aReceber.toFixed(2),
    totalVencido:+totalVencido.toFixed(2),
    qtdVencidos: vencidos.length,
    totalAtivo:  +totalAtivo.toFixed(2),
    accounts: accountsWithBalance,
  })
}
