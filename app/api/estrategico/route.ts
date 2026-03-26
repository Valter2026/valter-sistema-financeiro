import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Mapeamento de produto → BU por palavras-chave
function getBU(nome: string): string {
  const n = nome.toLowerCase()
  // Nutrição (antes de genérico)
  if (/shots|emagreça|emagrece|desinche|doces sem culpa|chás anti|cafés da manhã|marmita|lanches anti|tpm sem|cardápio|sobremesas para não|barriga off|corpo leve|neurobiológica|ansiedade zero|volte para suas roupas|programa corpo/i.test(nome)) return 'nutricao'
  // Gastronomia
  if (/restaurante|pratos para|porções para|lanches para|sobremesas para restaurante|ifood/i.test(nome)) return 'gastro'
  // Beleza
  if (/salão de beleza|salao de beleza/i.test(nome)) return 'beleza'
  // MID / MDV / Eventos
  if (/\bmid\b|mdv|movimento destrave|virada emocional|chave da virada|scale digital|impulso digital|desafio prosperidade|desafio códigos|reconexão|método id|metodo id|reamar|coliseum|imperium|imersão despert|renda extra turbo|seja master|destrave seu produto|destrave seu curso|70\+|chega de repetir|prosperidade tá on/i.test(nome)) return 'mid'
  // Empresário (default para financeiro/precificação)
  if (/precific|fluxo de caixa|\bdre\b|empresário|empresario|\bmei\b|\bmpl\b|combo|lucro e felicidade|financeiro sem caos|lucro do seu negócio|preço certo|empresario lucrativo|elite da prosperidade|master especialista|triade|destrave seu dinheiro/i.test(nome)) return 'empresario'
  return 'outros'
}

const BU_METAS_ABRIL: Record<string, number> = {
  empresario: 55000,
  nutricao:   20000,
  mid:        15000,
  gastro:      5000,
  beleza:      3000,
  outros:      2000,
}

const BU_LABELS: Record<string, string> = {
  empresario: '🏢 Empresário',
  nutricao:   '🥗 Nutrição',
  gastro:     '🍽️ Gastronomia',
  beleza:     '💅 Beleza',
  mid:        '🧠 MID / MDV',
  outros:     '🚀 Outros',
}

export const maxDuration = 30

export async function GET() {
  try {
    const { supabase } = await requireAuth()
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

    // Vendas do ano corrente (2026) — filtro por date_create (igual à Eduzz)
    const { data: salesRaw, error } = await supabase
      .from('sales')
      .select('sale_id, content_title, sale_status, sale_total, sale_amount_win, date_payment, date_create')
      .or('sale_status.eq.3,sale_status.eq.7')
      .gte('date_create', '2026-01-01')
      .lte('date_create', hoje + 'T23:59:59')

    if (error) throw new Error(error.message)

    const pagas = (salesRaw ?? []).filter((s: any) => s.sale_status === 3)

    // Agregar por BU
    const buMap: Record<string, { bruto: number; liquido: number; vendas: number; produtos: Set<string> }> = {}

    for (const s of pagas) {
      const bu = getBU(s.content_title ?? '')
      if (!buMap[bu]) buMap[bu] = { bruto: 0, liquido: 0, vendas: 0, produtos: new Set() }
      buMap[bu].bruto   += Number(s.sale_total ?? 0)
      buMap[bu].liquido += Number(s.sale_amount_win   ?? 0)
      buMap[bu].vendas  += 1
      buMap[bu].produtos.add(s.content_title ?? '')
    }

    const bus = Object.entries(buMap).map(([bu, d]) => ({
      bu,
      label:    BU_LABELS[bu] ?? bu,
      bruto:    Math.round(d.bruto * 100) / 100,
      liquido:  Math.round(d.liquido * 100) / 100,
      vendas:   d.vendas,
      produtos: d.produtos.size,
      meta:     BU_METAS_ABRIL[bu] ?? 0,
      pct:      BU_METAS_ABRIL[bu] ? Math.min(100, Math.round((d.bruto / BU_METAS_ABRIL[bu]) * 100)) : 0,
    })).sort((a, b) => b.bruto - a.bruto)

    // Totais gerais
    const totalBruto   = pagas.reduce((s: number, v: any) => s + Number(v.sale_total ?? 0), 0)
    const totalLiquido = pagas.reduce((s: number, v: any) => s + Number(v.sale_amount_win   ?? 0), 0)
    const totalVendas  = pagas.length

    // Top produtos por BU
    const prodMap: Record<string, { vendas: number; bruto: number; bu: string }> = {}
    for (const s of pagas) {
      const k = s.content_title ?? 'Sem nome'
      if (!prodMap[k]) prodMap[k] = { vendas: 0, bruto: 0, bu: getBU(k) }
      prodMap[k].vendas += 1
      prodMap[k].bruto  += Number(s.sale_total ?? 0)
    }
    const topProdutos = Object.entries(prodMap)
      .map(([nome, d]) => ({ nome, ...d, bruto: Math.round(d.bruto * 100) / 100 }))
      .sort((a, b) => b.bruto - a.bruto)
      .slice(0, 20)

    // Evolução mensal
    const mensalMap: Record<string, { bruto: number; liquido: number }> = {}
    for (const s of pagas) {
      const mes = (s.date_create ?? s.date_payment ?? '').substring(0, 7)
      if (!mes) continue
      if (!mensalMap[mes]) mensalMap[mes] = { bruto: 0, liquido: 0 }
      mensalMap[mes].bruto   += Number(s.sale_total ?? 0)
      mensalMap[mes].liquido += Number(s.sale_amount_win   ?? 0)
    }
    const evolucao = Object.entries(mensalMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, d]) => ({ mes, bruto: Math.round(d.bruto), liquido: Math.round(d.liquido) }))

    return NextResponse.json({
      totalBruto:   Math.round(totalBruto * 100) / 100,
      totalLiquido: Math.round(totalLiquido * 100) / 100,
      totalVendas,
      metaAbril:    100000,
      bus,
      topProdutos,
      evolucao,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
