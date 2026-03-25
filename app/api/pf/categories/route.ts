import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('pf_categories')
    .select('*')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await requireAuth()
  const body = await req.json()
  const { data, error } = await supabase
    .from('pf_categories')
    .insert([{ name: body.name, type: body.type, color: body.color, icon: body.icon, parent_id: body.parent_id ?? null, user_id: user.id }])
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { supabase } = await requireAuth()
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabase
    .from('pf_categories')
    .update(rest)
    .eq('id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { id } = await req.json()
  const { error } = await supabase.from('pf_categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
