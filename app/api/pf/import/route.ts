import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { user, supabase } = await requireAuth()
  const { rows } = await req.json()
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: 'Nenhum lançamento' }, { status: 400 })

  const toInsert = rows.map((r: any) => ({
    type:        r.type        ?? 'expense',
    description: r.description ?? null,
    amount:      Math.abs(Number(r.amount)) || 0,
    date:        r.date,
    account_id:  r.account_id  || null,
    category_id: r.category_id || null,
    status:      'confirmed',
    recurrence:  'single',
    notes:       r.notes || null,
    user_id:     user.id,
  }))

  const { data, error } = await supabase
    .from('pf_transactions')
    .insert(toInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: data?.length ?? 0 })
}
