import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('fin_advisor_schedule').select('*').eq('id', 1).single()
  return NextResponse.json(data ?? {
    weekly_day: 1, monthly_day: 1,
    enabled: true, receive_messages: true, receive_audio: true,
    send_whatsapp: false, whatsapp_phone: '',
  })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { error } = await supabaseAdmin
    .from('fin_advisor_schedule')
    .upsert({ id: 1, ...body })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
