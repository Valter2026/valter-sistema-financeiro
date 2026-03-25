import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { supabase } = await requireAuth()
  const url    = new URL(req.url)
  const start  = url.searchParams.get('start')
  const end    = url.searchParams.get('end')
  const status = url.searchParams.get('status')
  const type   = url.searchParams.get('type')
  const accountId = url.searchParams.get('account_id')

  let q = supabase
    .from('fin_transactions')
    .select(`
      *,
      account:fin_accounts!fin_transactions_account_id_fkey(id,name,type,color),
      to_account:fin_accounts!fin_transactions_to_account_id_fkey(id,name,type,color),
      category:fin_categories(id,name,type,color,parent_id)
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (start)     q = q.gte('date', start)
  if (end)       q = q.lte('date', end)
  if (status)    q = q.eq('status', status)
  if (type)      q = q.eq('type', type)
  if (accountId) q = q.eq('account_id', accountId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await requireAuth()
  const body = await req.json()

  // Lançamentos parcelados — gera N registros
  if (body.recurrence_type === 'installment' && body.total_installments > 1) {
    const recurrence_id = crypto.randomUUID()
    const rows = []
    for (let i = 0; i < body.total_installments; i++) {
      const d = new Date(body.date)
      d.setMonth(d.getMonth() + i)
      rows.push({
        ...body,
        date: d.toISOString().split('T')[0],
        due_date: d.toISOString().split('T')[0],
        recurrence_id,
        installment_num: i + 1,
        user_id: user.id,
      })
    }
    const { data, error } = await supabase.from('fin_transactions').insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('fin_transactions')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { supabase } = await requireAuth()
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabase
    .from('fin_transactions')
    .update(rest)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { id } = await req.json()
  const { error } = await supabase.from('fin_transactions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
