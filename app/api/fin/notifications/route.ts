import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { supabase } = await requireAuth()
  const { data } = await supabase
    .from('fin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  return NextResponse.json(data ?? [])
}

export async function PUT(req: Request) {
  const { supabase } = await requireAuth()
  const { id, all } = await req.json()
  if (all) {
    await supabase.from('fin_notifications').update({ read: true }).eq('read', false)
  } else if (id) {
    await supabase.from('fin_notifications').update({ read: true }).eq('id', id)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const { supabase } = await requireAuth()
  await supabase.from('fin_notifications').delete().eq('read', true)
  return NextResponse.json({ ok: true })
}
