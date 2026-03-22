import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') ?? new Date().toISOString().slice(0, 7) + '-01'
  const end   = searchParams.get('end')   ?? new Date().toISOString().slice(0, 10)

  const [txRes, accRes, goalRes, billsRes] = await Promise.all([
    supabaseAdmin.from('pf_transactions').select('type,amount,status,date').eq('status', 'confirmed').gte('date', start).lte('date', end),
    supabaseAdmin.from('pf_accounts').select('id,name,color,opening_balance,active'),
    supabaseAdmin.from('pf_goals').select('*').eq('status', 'active'),
    supabaseAdmin.from('pf_transactions').select('id,amount,date,description,status').in('status', ['pending','scheduled']).eq('type', 'expense'),
  ])

  const txs   = txRes.data ?? []
  const accs  = accRes.data ?? []
  const goals = goalRes.data ?? []
  const bills = billsRes.data ?? []

  const receitas = txs.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
  const despesas = txs.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
  const resultado = receitas - despesas

  // Saldo real por conta = saldo inicial + entradas - saídas confirmadas
  const { data: allTx } = await supabaseAdmin
    .from('pf_transactions')
    .select('account_id,type,amount,status')
    .eq('status', 'confirmed')

  const accountsWithBalance = accs.map(acc => {
    const movements = (allTx ?? []).filter(t => t.account_id === acc.id)
    const inflow    = movements.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
    const outflow   = movements.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
    return { ...acc, balance: Number(acc.opening_balance) + inflow - outflow }
  })

  const totalAtivo = accountsWithBalance.reduce((a, acc) => a + acc.balance, 0)

  const today = new Date().toISOString().split('T')[0]
  const vencidos  = bills.filter(b => b.date < today)
  const aPagar    = bills.reduce((a, b) => a + Number(b.amount), 0)
  const totalVencido = vencidos.reduce((a, b) => a + Number(b.amount), 0)

  return NextResponse.json({
    receitas,
    despesas,
    resultado,
    totalAtivo,
    aPagar,
    totalVencido,
    qtdVencidos: vencidos.length,
    accounts: accountsWithBalance,
    goals,
  })
}
