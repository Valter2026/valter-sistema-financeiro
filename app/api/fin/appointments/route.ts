import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { searchParams } = req.nextUrl
  const start = searchParams.get('start')
  const end   = searchParams.get('end')

  let query = supabase.from('fin_appointments').select('*').order('date').order('time', { nullsFirst: false })
  if (start) query = query.gte('date', start)
  if (end)   query = query.lte('date', end)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await requireAuth()
  const body = await req.json()
  const { data, error } = await supabase.from('fin_appointments').insert([{ ...body, user_id: user.id }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { id, ...body } = await req.json()
  const { data, error } = await supabase.from('fin_appointments').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { id } = await req.json()
  const { error } = await supabase.from('fin_appointments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
