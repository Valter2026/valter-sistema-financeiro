import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('fin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  return NextResponse.json(data ?? [])
}

export async function PUT(req: Request) {
  const { id, all } = await req.json()
  if (all) {
    await supabaseAdmin.from('fin_notifications').update({ read: true }).eq('read', false)
  } else if (id) {
    await supabaseAdmin.from('fin_notifications').update({ read: true }).eq('id', id)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await supabaseAdmin.from('fin_notifications').delete().eq('read', true)
  return NextResponse.json({ ok: true })
}
