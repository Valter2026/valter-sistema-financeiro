import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export const maxDuration = 30

// Datas em horário de Brasília (UTC-3) para bater com a Eduzz
function brDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function today() { return brDate(new Date()) }

function getRange(period: string, customStart?: string, customEnd?: string): { start: string; end: string } {
  if (customStart && customEnd) return { start: customStart, end: customEnd }

  const now = new Date()

  switch (period) {
    case '7d':   { const s = new Date(now); s.setDate(s.getDate() - 6); return { start: brDate(s), end: brDate(now) } }
    case '30d':  { const s = new Date(now); s.setDate(s.getDate() - 29); return { start: brDate(s), end: brDate(now) } }
    case '90d':  { const s = new Date(now); s.setDate(s.getDate() - 89); return { start: brDate(s), end: brDate(now) } }
    case '2024': return { start: '2024-01-01', end: '2024-12-31' }
    case '2025': return { start: '2025-01-01', end: '2025-12-31' }
    case '2026': return { start: '2026-01-01', end: today() }
    default:     return { start: '2024-01-01', end: today() }
  }
}

async function querySales(supabase: any, start: string, end: string) {
  // Filtra por date_create (igual à Eduzz) para bater os valores
  const { data, error } = await supabase
    .from('sales').select('*')
    .gte('date_create', start)
    .lte('date_create', end + 'T23:59:59')
  if (error) throw new Error(error.message)

  // Deduplica por sale_id
  const seen = new Set<number>()
  return (data ?? []).filter((s: any) => {
    if (seen.has(s.sale_id)) return false
    seen.add(s.sale_id)
    return true
  })
}

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireAuth()
    const url         = new URL(req.url)
    const period      = url.searchParams.get('period') ?? 'all'
    const customStart = url.searchParams.get('start') ?? undefined
    const customEnd   = url.searchParams.get('end')   ?? undefined
    const { start, end } = getRange(period, customStart, customEnd)

    const all    = await querySales(supabase, start, end)
    const pagas  = all.filter((s: any) => s.sale_status === 3)
    const reemb  = all.filter((s: any) => s.sale_status === 7) // reembolsados

    const bruto       = pagas.reduce((a: number, s: any) => a + (s.sale_total      ?? 0), 0)
    const liquido     = pagas.reduce((a: number, s: any) => a + (s.sale_amount_win ?? 0), 0)
    const taxaPlat    = pagas.reduce((a: number, s: any) => a + (s.sale_fee        ?? 0), 0)
    const taxaCoop    = pagas.reduce((a: number, s: any) => a + (s.sale_coop       ?? 0), 0)
    const quantidade  = pagas.length
    const ticketMedio = quantidade > 0 ? bruto / quantidade : 0

    const reembolsoValor  = reemb.reduce((a: number, s: any) => a + (s.sale_total ?? 0), 0)
    const reembolsoQtd    = reemb.length
    const reembolsoPctBruto  = bruto > 0   ? (reembolsoValor / bruto)   * 100 : 0
    const reembolsoPctLiq    = liquido > 0 ? (reembolsoValor / liquido) * 100 : 0

    // Por produto
    const porProduto: Record<string, any> = {}
    for (const s of pagas) {
      const id = String(s.content_id)
      if (!porProduto[id]) porProduto[id] = { nome: s.content_title ?? 'Sem nome', vendas: 0, bruto: 0, liquido: 0 }
      porProduto[id].vendas++
      porProduto[id].bruto   += s.sale_total      ?? 0
      porProduto[id].liquido += s.sale_amount_win ?? 0
    }

    // Por dia
    const porDia: Record<string, any> = {}
    for (const s of pagas) {
      const dia = (s.date_create ?? s.date_payment ?? '').substring(0, 10)
      if (!dia) continue
      if (!porDia[dia]) porDia[dia] = { bruto: 0, liquido: 0, vendas: 0 }
      porDia[dia].bruto   += s.sale_total      ?? 0
      porDia[dia].liquido += s.sale_amount_win ?? 0
      porDia[dia].vendas++
    }

    // Por mês
    const porMes: Record<string, any> = {}
    for (const s of pagas) {
      const mes = (s.date_create ?? s.date_payment ?? '').substring(0, 7)
      if (!mes) continue
      if (!porMes[mes]) porMes[mes] = { bruto: 0, liquido: 0, vendas: 0, reembolso: 0 }
      porMes[mes].bruto   += s.sale_total      ?? 0
      porMes[mes].liquido += s.sale_amount_win ?? 0
      porMes[mes].vendas++
    }
    for (const s of reemb) {
      const mes = (s.date_create ?? s.date_payment ?? '').substring(0, 7)
      if (!mes) continue
      if (!porMes[mes]) porMes[mes] = { bruto: 0, liquido: 0, vendas: 0, reembolso: 0 }
      porMes[mes].reembolso += s.sale_total ?? 0
    }

    // Por método de pagamento
    const porMetodo: Record<string, number> = {}
    for (const s of pagas) {
      const m = s.sale_payment_method ?? 'Outros'
      porMetodo[m] = (porMetodo[m] ?? 0) + 1
    }

    // Por status (todos)
    const porStatus: Record<string, number> = {}
    for (const s of all) {
      const st = s.sale_status_name ?? `Status ${s.sale_status}`
      porStatus[st] = (porStatus[st] ?? 0) + 1
    }

    return NextResponse.json({
      periodo:   { start, end },
      bruto:     parseFloat(bruto.toFixed(2)),
      liquido:   parseFloat(liquido.toFixed(2)),
      totalTaxas:parseFloat((taxaPlat + taxaCoop).toFixed(2)),
      taxaPlat:  parseFloat(taxaPlat.toFixed(2)),
      taxaCoop:  parseFloat(taxaCoop.toFixed(2)),
      quantidade,
      ticketMedio:    parseFloat(ticketMedio.toFixed(2)),
      totalRegistros: all.length,

      reembolsos: {
        valor:    parseFloat(reembolsoValor.toFixed(2)),
        qtd:      reembolsoQtd,
        pctBruto: parseFloat(reembolsoPctBruto.toFixed(2)),
        pctLiq:   parseFloat(reembolsoPctLiq.toFixed(2)),
      },

      graficoDiario: Object.entries(porDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, v]) => ({ data, bruto: +v.bruto.toFixed(2), liquido: +v.liquido.toFixed(2), vendas: v.vendas })),

      graficoMensal: Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, v]) => ({ mes, bruto: +v.bruto.toFixed(2), liquido: +v.liquido.toFixed(2), vendas: v.vendas, reembolso: +(v.reembolso ?? 0).toFixed(2) })),

      porProduto: Object.values(porProduto)
        .sort((a: any, b: any) => b.vendas - a.vendas)
        .map((p: any) => ({ ...p, bruto: +p.bruto.toFixed(2), liquido: +p.liquido.toFixed(2) })),

      porMetodo: Object.entries(porMetodo)
        .sort(([, a], [, b]) => b - a)
        .map(([metodo, qtd]) => ({ metodo, qtd })),

      porStatus: Object.entries(porStatus)
        .sort(([, a], [, b]) => b - a)
        .map(([status, qtd]) => ({ status, qtd })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
