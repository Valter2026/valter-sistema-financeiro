import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  checking:    'Conta Corrente',
  savings:     'Poupança',
  investments: 'Investimentos',
  cash:        'Dinheiro (Carteira)',
  credit_card: 'Cartão de Crédito',
  other:       'Outros',
}

export async function GET() {
  const { data: accs } = await supabaseAdmin.from('pf_accounts').select('*').order('name')
  const { data: allTx } = await supabaseAdmin.from('pf_transactions').select('account_id,type,amount,status').eq('status', 'confirmed')

  const accountsWithBalance = (accs ?? []).map(acc => {
    const movements = (allTx ?? []).filter(t => t.account_id === acc.id)
    const inflow    = movements.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
    const outflow   = movements.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
    const balance   = Number(acc.opening_balance ?? 0) + inflow - outflow
    return { ...acc, balance, typeLabel: ACCOUNT_TYPE_LABEL[acc.type] ?? acc.type }
  })

  // Ativos: contas positivas (não cartão de crédito)
  const ativos = accountsWithBalance.filter(a => a.type !== 'credit_card' && a.active !== false)
  // Passivos: cartões de crédito (saldo negativo = dívida)
  const passivos = accountsWithBalance.filter(a => a.type === 'credit_card' && a.active !== false)

  const totalAtivos   = ativos.reduce((a, acc) => a + Math.max(0, acc.balance), 0)
  const totalPassivos = passivos.reduce((a, acc) => a + Math.max(0, -acc.balance), 0)
  const patrimonioLiquido = totalAtivos - totalPassivos

  // Agrupa ativos por tipo
  const ativosPorTipo: Record<string, { label: string; items: any[]; total: number }> = {}
  for (const acc of ativos) {
    const key = acc.type ?? 'other'
    if (!ativosPorTipo[key]) ativosPorTipo[key] = { label: ACCOUNT_TYPE_LABEL[key] ?? key, items: [], total: 0 }
    ativosPorTipo[key].items.push(acc)
    ativosPorTipo[key].total += acc.balance
  }

  return NextResponse.json({
    ativos: Object.values(ativosPorTipo),
    passivos,
    totalAtivos,
    totalPassivos,
    patrimonioLiquido,
  })
}
