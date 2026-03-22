import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') ?? new Date().getMonth() + 1
  const year  = searchParams.get('year')  ?? new Date().getFullYear()

  const { data: budgets, error } = await supabaseAdmin
    .from('pf_budgets')
    .select('*, category:pf_categories(id,name,color,icon)')
    .eq('month', month)
    .eq('year', year)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Busca gastos reais por categoria no mês
  const m = String(month).padStart(2, '0')
  const { data: txs } = await supabaseAdmin
    .from('pf_transactions')
    .select('category_id,amount')
    .eq('type', 'expense')
    .eq('status', 'confirmed')
    .gte('date', `${year}-${m}-01`)
    .lte('date', `${year}-${m}-31`)

  const spent: Record<string, number> = {}
  ;(txs ?? []).forEach(t => {
    if (t.category_id) spent[t.category_id] = (spent[t.category_id] ?? 0) + Number(t.amount)
  })

  const result = (budgets ?? []).map(b => ({
    ...b,
    spent:     spent[b.category_id] ?? 0,
    remaining: b.amount - (spent[b.category_id] ?? 0),
    percent:   Math.min(100, Math.round(((spent[b.category_id] ?? 0) / b.amount) * 100)),
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('pf_budgets')
    .upsert([{ category_id: body.category_id, month: body.month, year: body.year, amount: body.amount }], { onConflict: 'category_id,month,year' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabaseAdmin.from('pf_budgets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
