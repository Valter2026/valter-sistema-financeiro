import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — lista notificações (não lidas primeiro)
export async function GET(req: NextRequest) {
  const limit = Number(new URL(req.url).searchParams.get('limit') ?? '20')
  const { data, error } = await supabaseAdmin
    .from('pf_notifications')
    .select('*')
    .order('read',       { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// PUT — marca como lida (id='all' marca todas)
export async function PUT(req: NextRequest) {
  const { id } = await req.json()
  if (id === 'all') {
    await supabaseAdmin.from('pf_notifications').update({ read: true }).eq('read', false)
  } else {
    await supabaseAdmin.from('pf_notifications').update({ read: true }).eq('id', id)
  }
  return NextResponse.json({ ok: true })
}

// DELETE — apaga notificações já lidas
export async function DELETE() {
  await supabaseAdmin.from('pf_notifications').delete().eq('read', true)
  return NextResponse.json({ ok: true })
}
