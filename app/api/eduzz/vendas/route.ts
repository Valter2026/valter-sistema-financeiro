import { NextRequest, NextResponse } from 'next/server'
import { getSalesList } from '@/lib/eduzz'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? '30d'

    const end = new Date()
    const start = new Date()
    if (period === '7d') start.setDate(start.getDate() - 7)
    else if (period === '30d') start.setDate(start.getDate() - 30)
    else if (period === '90d') start.setDate(start.getDate() - 90)
    else if (period === '12m') start.setFullYear(start.getFullYear() - 1)
    else if (period === 'all') start.setFullYear(2020, 0, 1)

    const fmt = (d: Date) => d.toISOString().split('T')[0]

    // Busca todas as páginas
    let allSales: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const data = await getSalesList({
        start_date: fmt(start),
        end_date: fmt(end),
        page,
        rows: 100,
      })

      const items = data?.rows ?? data ?? []
      allSales = [...allSales, ...items]
      hasMore = items.length === 100
      page++
      if (page > 20) break // segurança
    }

    // Processa os dados
    const totalFaturamento = allSales.reduce((acc: number, s: any) => acc + (parseFloat(s.val_total_sale) || 0), 0)
    const totalVendas = allSales.length
    const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0

    // Agrupa por produto
    const porProduto: Record<string, { nome: string; vendas: number; faturamento: number }> = {}
    for (const s of allSales) {
      const id = s.cod_content ?? 'outros'
      const nome = s.title_content ?? 'Produto sem nome'
      if (!porProduto[id]) porProduto[id] = { nome, vendas: 0, faturamento: 0 }
      porProduto[id].vendas++
      porProduto[id].faturamento += parseFloat(s.val_total_sale) || 0
    }

    // Agrupa por dia
    const porDia: Record<string, number> = {}
    for (const s of allSales) {
      const dia = (s.dat_sale ?? s.dat_create ?? '').substring(0, 10)
      if (dia) porDia[dia] = (porDia[dia] ?? 0) + (parseFloat(s.val_total_sale) || 0)
    }

    const graficoDiario = Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, valor]) => ({ data, valor: parseFloat(valor.toFixed(2)) }))

    return NextResponse.json({
      totalFaturamento: parseFloat(totalFaturamento.toFixed(2)),
      totalVendas,
      ticketMedio: parseFloat(ticketMedio.toFixed(2)),
      porProduto: Object.values(porProduto).sort((a, b) => b.faturamento - a.faturamento),
      graficoDiario,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
