import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseAppointmentVoice } from '@/lib/appointment-voice-parser'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  return NextResponse.json(parseAppointmentVoice(text))
}

export async function PUT(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })

  const parsed = parseAppointmentVoice(text)
  const { data, error } = await supabaseAdmin
    .from('fin_appointments')
    .insert([{
      title:       parsed.title,
      date:        parsed.date,
      time:        parsed.time,
      type:        parsed.type,
      status:      'scheduled',
      voice_input: parsed.voice_input,
    }])
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, appointment: data, parsed })
}
