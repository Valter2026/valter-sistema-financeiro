import { NextRequest, NextResponse } from 'next/server'
import { parseAppointmentVoiceCommand } from '@/lib/appointment-voice-parser'
import { handleAppointmentVoice } from '@/lib/appointment-voice-handler'
import { requireAuth } from '@/lib/auth'

const TABLE = 'fin_appointments' as const

/** POST — parse apenas, sem salvar */
export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  return NextResponse.json(parseAppointmentVoiceCommand(text))
}

/** PUT — executa comando de voz (criar / atualizar / excluir) */
export async function PUT(req: NextRequest) {
  const { supabase } = await requireAuth()
  const { text, forceId } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })

  const result = await handleAppointmentVoice(supabase, text, TABLE, forceId)
  if (!result.ok) return NextResponse.json(result, { status: result.reason === 'multiple_matches' ? 300 : 404 })
  return NextResponse.json(result)
}
