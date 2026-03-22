import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: projects, error } = await supabaseAdmin
    .from('pf_projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Adiciona total gasto por projeto
  const withSpent = await Promise.all((projects ?? []).map(async p => {
    const { data: txs } = await supabaseAdmin
      .from('pf_transactions')
      .select('amount, type')
      .eq('project_id', p.id)
      .eq('status', 'confirmed')

    const spent   = (txs ?? []).filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
    const income  = (txs ?? []).filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0)
    const count   = (txs ?? []).length
    const percent = p.budget > 0 ? Math.round((spent / p.budget) * 100) : 0

    return { ...p, spent, income, count, percent, remaining: p.budget - spent }
  }))

  return NextResponse.json(withSpent)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('pf_projects')
    .insert([{
      name:        body.name,
      description: body.description || null,
      budget:      body.budget      || 0,
      color:       body.color       || '#6b7280',
      icon:        body.icon        || '📁',
      start_date:  body.start_date  || null,
      end_date:    body.end_date    || null,
      status:      body.status      || 'active',
    }])
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabaseAdmin
    .from('pf_projects')
    .update(rest)
    .eq('id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  // Desvincula lançamentos antes de deletar
  await supabaseAdmin.from('pf_transactions').update({ project_id: null }).eq('project_id', id)
  const { error } = await supabaseAdmin.from('pf_projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
