import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type       = searchParams.get('type')
  const status     = searchParams.get('status')
  const start      = searchParams.get('start')
  const end        = searchParams.get('end')
  const month      = searchParams.get('month')
  const year       = searchParams.get('year')
  const tag        = searchParams.get('tag')
  const project_id = searchParams.get('project_id')

  let q = supabaseAdmin
    .from('pf_transactions')
    .select('*, account:pf_accounts(id,name,color), category:pf_categories(id,name,color,icon,type)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (type)       q = q.eq('type', type)
  if (status)     q = q.eq('status', status)
  if (start)      q = q.gte('date', start)
  if (end)        q = q.lte('date', end)
  if (tag)        q = q.contains('tags', [tag])
  if (project_id) q = q.eq('project_id', project_id)
  if (month && year) {
    const m = String(month).padStart(2, '0')
    q = q.gte('date', `${year}-${m}-01`).lte('date', `${year}-${m}-31`)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.recurrence === 'installment' && body.installment_total > 1) {
    const groupId = crypto.randomUUID()
    const rows = Array.from({ length: body.installment_total }, (_, i) => {
      const d   = new Date(body.date + 'T12:00:00')
      d.setMonth(d.getMonth() + i)
      return {
        type:                body.type,
        description:         body.description ? `${body.description} (${i+1}/${body.installment_total})` : null,
        amount:              body.amount,
        date:                d.toISOString().split('T')[0],
        account_id:          body.account_id || null,
        category_id:         body.category_id || null,
        status:              body.status ?? 'pending',
        recurrence:          'installment',
        installment_current: i + 1,
        installment_total:   body.installment_total,
        group_id:            groupId,
        notes:               body.notes || null,
        voice_input:         body.voice_input || null,
      }
    })
    const { error } = await supabaseAdmin.from('pf_transactions').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, installments: body.installment_total })
  }

  const { data, error } = await supabaseAdmin
    .from('pf_transactions')
    .insert([{
      type:        body.type,
      description: body.description || null,
      amount:      body.amount,
      date:        body.date,
      account_id:  body.account_id || null,
      category_id: body.category_id || null,
      status:      body.status ?? 'confirmed',
      recurrence:  body.recurrence ?? 'single',
      notes:       body.notes || null,
      voice_input: body.voice_input || null,
    }])
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabaseAdmin
    .from('pf_transactions')
    .update(rest)
    .eq('id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabaseAdmin.from('pf_transactions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
