import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { supabase } = await requireAuth()
  const { data } = await supabase
    .from('fin_advisor_schedule').select('*').eq('id', 1).single()
  return NextResponse.json(data ?? {
    weekly_day: 1, monthly_day: 1,
    enabled: true, receive_messages: true, receive_audio: true,
    send_whatsapp: false, whatsapp_phone: '',
  })
}

export async function PUT(req: Request) {
  const { supabase } = await requireAuth()
  const body = await req.json()
  const { error } = await supabase
    .from('fin_advisor_schedule')
    .upsert({ id: 1, ...body })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
