import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('pf_goals')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await requireAuth()
  const body = await req.json()
  const { data, error } = await supabase
    .from('pf_goals')
    .insert([{
      name:           body.name,
      description:    body.description || null,
      target_amount:  body.target_amount,
      current_amount: body.current_amount ?? 0,
      target_date:    body.target_date || null,
      color:          body.color ?? '#3b82f6',
      icon:           body.icon ?? '🎯',
      user_id:        user.id,
    }])
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { supabase } = await requireAuth()
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabase
    .from('pf_goals')
    .update(rest)
    .eq('id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { id } = await req.json()
  const { error } = await supabase.from('pf_goals').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
