import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 30

const today = () => new Date().toISOString().split('T')[0]

function getRange(period: string, customStart?: string, customEnd?: string): { start: string; end: string } {
  // Suporte a datas customizadas diretas
  if (customStart && customEnd) return { start: customStart, end: customEnd }

  const end   = new Date()
  const start = new Date()

  switch (period) {
    case '7d':   start.setDate(start.getDate() - 7);         break
    case '30d':  start.setDate(start.getDate() - 30);        break
    case '90d':  start.setDate(start.getDate() - 90);        break
    case '2024': return { start: '2024-01-01', end: '2024-12-31' }
    case '2025': return { start: '2025-01-01', end: '2025-12-31' }
    case '2026': return { start: '2026-01-01', end: today() }
    default:     return { start: '2024-01-01', end: today() }
  }

  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}

async function querySales(start: string, end: string) {
  // Vendas com date_payment no período
  const { data: s1, error: e1 } = await supabaseAdmin
    .from('sales').select('*')
    .gte('date_payment', start)
    .lte('date_payment', end + 'T23:59:59')
  if (e1) throw new Error(e1.message)

  // Vendas pagas (status=3) com date_payment nulo mas date_create no período
  const { data: s2, error: e2 } = await supabaseAdmin
    .from('sales').select('*')
    .eq('sale_status', 3)
    .is('date_payment', null)
    .gte('date_create', start)
    .lte('date_create', end + 'T23:59:59')
  if (e2) throw new Error(e2.message)

  const merged = [...(s1 ?? []), ...(s2 ?? [])]
  const seen   = new Set<number>()
  return merged.filter((s: any) => { if (seen.has(s.sale_id)) return false; seen.add(s.sale_id); return true })
}

export async function GET(req: NextRequest) {
  try {
    const url         = new URL(req.url)
    const period      = url.searchParams.get('period') ?? 'all'
    const customStart = url.searchParams.get('start') ?? undefined
    const customEnd   = url.searchParams.get('end')   ?? undefined
    const { start, end } = getRange(period, customStart, customEnd)

    const all    = await querySales(start, end)
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
      const dia = (s.date_payment ?? s.date_create ?? '').substring(0, 10)
      if (!dia) continue
      if (!porDia[dia]) porDia[dia] = { bruto: 0, liquido: 0, vendas: 0 }
      porDia[dia].bruto   += s.sale_total      ?? 0
      porDia[dia].liquido += s.sale_amount_win ?? 0
      porDia[dia].vendas++
    }

    // Por mês
    const porMes: Record<string, any> = {}
    for (const s of pagas) {
      const mes = (s.date_payment ?? s.date_create ?? '').substring(0, 7)
      if (!mes) continue
      if (!porMes[mes]) porMes[mes] = { bruto: 0, liquido: 0, vendas: 0, reembolso: 0 }
      porMes[mes].bruto   += s.sale_total      ?? 0
      porMes[mes].liquido += s.sale_amount_win ?? 0
      porMes[mes].vendas++
    }
    for (const s of reemb) {
      const mes = (s.date_payment ?? s.date_create ?? '').substring(0, 7)
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
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
