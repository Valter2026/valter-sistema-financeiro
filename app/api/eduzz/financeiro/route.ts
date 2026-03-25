import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export const maxDuration = 30

const EDUZZ_BASE   = 'https://api2.eduzz.com'
const EDUZZ_EMAIL  = process.env.EDUZZ_EMAIL!
const EDUZZ_PUBLIC = process.env.EDUZZ_PUBLIC_KEY!
const EDUZZ_APIKEY = process.env.EDUZZ_API_KEY!

const today = () => new Date().toISOString().split('T')[0]

// Cache simples de saldo (5 min)
let saldoCache: { value: any; at: number } | null = null

async function getSaldo() {
  if (saldoCache && Date.now() - saldoCache.at < 5 * 60 * 1000) return saldoCache.value
  try {
    const tokenRes = await fetch(`${EDUZZ_BASE}/credential/generate_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EDUZZ_EMAIL, publickey: EDUZZ_PUBLIC, apikey: EDUZZ_APIKEY }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.success) return { saldo: 0, saldoFuturo: 0 }

    const token   = tokenData.data.token
    const balRes  = await fetch(`${EDUZZ_BASE}/financial/balance`, {
      headers: { token, PublicKey: EDUZZ_PUBLIC },
    })
    const balData = await balRes.json()
    const item    = Array.isArray(balData.data) ? balData.data[0] : balData.data
    const value   = {
      saldo:       parseFloat(item?.balance       ?? '0'),
      saldoFuturo: parseFloat(item?.future_balance ?? '0'),
    }
    saldoCache = { value, at: Date.now() }
    return value
  } catch {
    return { saldo: 0, saldoFuturo: 0 }
  }
}

async function querySales(supabase: any, start: string, end: string) {
  const { data: s1, error: e1 } = await supabase
    .from('sales').select('sale_status,sale_total,sale_amount_win,sale_fee,sale_coop,date_payment,date_create')
    .gte('date_payment', start)
    .lte('date_payment', end + 'T23:59:59')
  if (e1) throw new Error(e1.message)

  const { data: s2, error: e2 } = await supabase
    .from('sales').select('sale_status,sale_total,sale_amount_win,sale_fee,sale_coop,date_payment,date_create')
    .eq('sale_status', 3)
    .is('date_payment', null)
    .gte('date_create', start)
    .lte('date_create', end + 'T23:59:59')
  if (e2) throw new Error(e2.message)

  return [...(s1 ?? []), ...(s2 ?? [])]
}

function calc(sales: any[]) {
  const pagas  = sales.filter(s => s.sale_status === 3)
  const reemb  = sales.filter(s => s.sale_status === 7)
  const bruto    = pagas.reduce((a, s) => a + (s.sale_total      ?? 0), 0)
  const liquido  = pagas.reduce((a, s) => a + (s.sale_amount_win ?? 0), 0)
  const taxaPlat = pagas.reduce((a, s) => a + (s.sale_fee        ?? 0), 0)
  const taxaCoop = pagas.reduce((a, s) => a + (s.sale_coop       ?? 0), 0)
  const reembolso= reemb.reduce((a, s) => a + (s.sale_total      ?? 0), 0)
  return {
    bruto, liquido, taxaPlat, taxaCoop,
    totalTaxas: taxaPlat + taxaCoop,
    quantidade: pagas.length,
    reembolso,
    reembolsoQtd: reemb.length,
    pctReembolsoBruto: bruto > 0   ? (reembolso / bruto)   * 100 : 0,
    pctReembolsoLiq:   liquido > 0 ? (reembolso / liquido) * 100 : 0,
  }
}

function getRange(period: string, customStart?: string, customEnd?: string) {
  if (customStart && customEnd) return { start: customStart, end: customEnd }
  switch (period) {
    case '7d':  { const d = new Date(); d.setDate(d.getDate()-7);  return { start: d.toISOString().split('T')[0], end: today() } }
    case '30d': { const d = new Date(); d.setDate(d.getDate()-30); return { start: d.toISOString().split('T')[0], end: today() } }
    case '90d': { const d = new Date(); d.setDate(d.getDate()-90); return { start: d.toISOString().split('T')[0], end: today() } }
    case '2024': return { start: '2024-01-01', end: '2024-12-31' }
    case '2025': return { start: '2025-01-01', end: '2025-12-31' }
    case '2026': return { start: '2026-01-01', end: today() }
    default:     return { start: '2024-01-01', end: today() }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireAuth()
    const url         = new URL(req.url)
    const period      = url.searchParams.get('period')  ?? 'mes'
    const customStart = url.searchParams.get('start')   ?? undefined
    const customEnd   = url.searchParams.get('end')     ?? undefined

    // Período atual selecionado
    const range = getRange(period, customStart, customEnd)

    // Mês atual e anterior (para o comparativo do topo)
    const now         = new Date()
    const mesCurrent  = { start: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, end: today() }
    const prevDate    = new Date(now.getFullYear(), now.getMonth(), 0)
    const mesAnterior = {
      start: `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}-01`,
      end:   prevDate.toISOString().split('T')[0],
    }

    // Busca todos os dados em paralelo
    const [salesPeriodo, salesMes, salesAnt, saldoData] = await Promise.all([
      querySales(supabase, range.start, range.end),
      querySales(supabase, mesCurrent.start, mesCurrent.end),
      querySales(supabase, mesAnterior.start, mesAnterior.end),
      getSaldo(),
    ])

    const periodo  = calc(salesPeriodo)
    const mes      = calc(salesMes)
    const anterior = calc(salesAnt)

    // DRE mês atual
    const dre = {
      receitaBruta:   +mes.bruto.toFixed(2),
      deducoes:       +mes.totalTaxas.toFixed(2),
      taxaPlataforma: +mes.taxaPlat.toFixed(2),
      taxaCoop:       +mes.taxaCoop.toFixed(2),
      reembolsos:     +mes.reembolso.toFixed(2),
      receitaLiquida: +mes.liquido.toFixed(2),
      margemLiquida:  mes.bruto > 0 ? +((mes.liquido / mes.bruto) * 100).toFixed(1) : 0,
    }

    // Mensal breakdown do período selecionado
    const porMes: Record<string, any> = {}
    for (const s of salesPeriodo) {
      const key = (s.date_payment ?? s.date_create ?? '').substring(0, 7)
      if (!key) continue
      if (!porMes[key]) porMes[key] = { bruto: 0, liquido: 0, taxas: 0, vendas: 0, reembolso: 0 }
      if (s.sale_status === 3) {
        porMes[key].bruto    += s.sale_total      ?? 0
        porMes[key].liquido  += s.sale_amount_win ?? 0
        porMes[key].taxas    += (s.sale_fee ?? 0) + (s.sale_coop ?? 0)
        porMes[key].vendas++
      }
      if (s.sale_status === 7) {
        porMes[key].reembolso += s.sale_total ?? 0
      }
    }

    const dreAnual = Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mesKey, v]) => ({
        mes:       mesKey,
        bruto:     +v.bruto.toFixed(2),
        liquido:   +v.liquido.toFixed(2),
        taxas:     +v.taxas.toFixed(2),
        reembolso: +v.reembolso.toFixed(2),
        vendas:    v.vendas,
        margem:    v.bruto > 0 ? +((v.liquido / v.bruto) * 100).toFixed(1) : 0,
        pctReembolso: v.bruto > 0 ? +((v.reembolso / v.bruto) * 100).toFixed(2) : 0,
      }))

    const crescimentoBruto = anterior.bruto > 0
      ? ((mes.bruto - anterior.bruto) / anterior.bruto) * 100 : 0

    return NextResponse.json({
      saldo:       saldoData.saldo,
      saldoFuturo: saldoData.saldoFuturo,

      mes: {
        ...mes,
        ticket: mes.quantidade > 0 ? +(mes.bruto / mes.quantidade).toFixed(2) : 0,
        pctReembolsoBruto: +mes.pctReembolsoBruto.toFixed(2),
        pctReembolsoLiq:   +mes.pctReembolsoLiq.toFixed(2),
      },
      anterior: {
        ...anterior,
        ticket: anterior.quantidade > 0 ? +(anterior.bruto / anterior.quantidade).toFixed(2) : 0,
      },
      crescimentoBruto: +crescimentoBruto.toFixed(1),
      dre,
      periodoMes:      mesCurrent,
      periodoAnterior: mesAnterior,

      // Dados do período selecionado
      periodo: {
        range,
        ...periodo,
        ticket: periodo.quantidade > 0 ? +(periodo.bruto / periodo.quantidade).toFixed(2) : 0,
        margemLiquida: periodo.bruto > 0 ? +((periodo.liquido / periodo.bruto) * 100).toFixed(1) : 0,
        pctReembolsoBruto: +periodo.pctReembolsoBruto.toFixed(2),
        pctReembolsoLiq:   +periodo.pctReembolsoLiq.toFixed(2),
      },
      dreAnual,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
