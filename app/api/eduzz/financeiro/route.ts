import { NextResponse } from 'next/server'
import { getFinancialBalance, getSalesList } from '@/lib/eduzz'

export async function GET() {
  try {
    const [balance, salesMes, salesMesAnterior] = await Promise.all([
      getFinancialBalance(),
      getSalesList({ start_date: getFirstDayOfMonth(), end_date: getToday(), rows: 100 }),
      getSalesList({ start_date: getFirstDayOfLastMonth(), end_date: getLastDayOfLastMonth(), rows: 100 }),
    ])

    const calcTotais = (sales: any) => {
      const items = sales?.rows ?? (Array.isArray(sales) ? sales : []) as any[]
      const bruto = items.reduce((acc: number, s: any) => acc + (parseFloat(s.val_total_sale) || 0), 0)
      const taxas = items.reduce((acc: number, s: any) => acc + (parseFloat(s.val_tax_total) || 0), 0)
      return { bruto, taxas, liquido: bruto - taxas, quantidade: items.length }
    }

    const mes = calcTotais(salesMes)
    const mesAnterior = calcTotais(salesMesAnterior)

    const crescimento = mesAnterior.bruto > 0
      ? ((mes.bruto - mesAnterior.bruto) / mesAnterior.bruto) * 100
      : 0

    // DRE simplificado
    const dre = {
      receitaBruta: mes.bruto,
      deducoes: mes.taxas,
      receitaLiquida: mes.liquido,
      // CPV estimado com base na média informada pelo usuário
      cpvEstimado: mes.quantidade * 30,
      margemBruta: mes.liquido - (mes.quantidade * 30),
      margemPercent: mes.liquido > 0 ? ((mes.liquido - (mes.quantidade * 30)) / mes.liquido) * 100 : 0,
    }

    return NextResponse.json({
      saldo: balance?.balance ?? 0,
      mes,
      mesAnterior,
      crescimento: parseFloat(crescimento.toFixed(1)),
      dre,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}
function getFirstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function getFirstDayOfLastMonth() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function getLastDayOfLastMonth() {
  const d = new Date()
  d.setDate(0)
  return d.toISOString().split('T')[0]
}
