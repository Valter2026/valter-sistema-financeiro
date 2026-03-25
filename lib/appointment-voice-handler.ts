// Handler compartilhado para comandos de voz de agenda
// Usado por /api/fin/appointments/voice e /api/pf/appointments/voice

import { parseAppointmentVoiceCommand } from '@/lib/appointment-voice-parser'
import type { SupabaseClient } from '@supabase/supabase-js'

export type VoiceHandlerResult =
  | { ok: true;  action: string; appointment: any; parsed: any }
  | { ok: false; reason: 'not_found' | 'multiple_matches' | 'no_value'; matches?: any[]; parsed: any }

export async function handleAppointmentVoice(
  supabase: SupabaseClient,
  text: string,
  table: 'pf_appointments' | 'fin_appointments',
  forceId?: string   // para confirmar a ação em um match específico após disambiguation
): Promise<VoiceHandlerResult> {

  const cmd = parseAppointmentVoiceCommand(text)

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (cmd.intent === 'create') {
    if (!cmd.title) {
      return { ok: false, reason: 'no_value', parsed: cmd }
    }
    const { data, error } = await supabase
      .from(table)
      .insert([{
        title:       cmd.title,
        date:        cmd.date,
        time:        cmd.time,
        type:        cmd.type,
        status:      'scheduled',
        voice_input: cmd.voice_input,
      }])
      .select().single()

    if (error) return { ok: false, reason: 'no_value', parsed: cmd }
    return { ok: true, action: 'created', appointment: data, parsed: cmd }
  }

  // ── OPERAÇÕES EM COMPROMISSO EXISTENTE ────────────────────────────────────

  let target: any

  if (forceId) {
    // Usuário confirmou manualmente qual appointment usar
    const { data } = await supabase.from(table).select('*').eq('id', forceId).single()
    target = data
  } else {
    // Busca por query + searchDate
    let query = supabase.from(table).select('*').order('date')

    if (cmd.searchQuery && cmd.searchQuery.length > 1) {
      // Tokeniza a query e faz OR de cada palavra relevante (>= 3 chars)
      const tokens = cmd.searchQuery.split(' ').filter(w => w.length >= 3)
      if (tokens.length > 0) {
        query = query.or(tokens.map(w => `title.ilike.%${w}%`).join(','))
      }
    }

    if (cmd.searchDate) {
      query = query.eq('date', cmd.searchDate)
    }

    // Exclui já concluídos/cancelados para buscas de update/delete
    // (exceto quando marcando como done/cancelled)
    if (cmd.intent !== 'mark_done' && cmd.intent !== 'mark_cancelled') {
      query = query.not('status', 'in', '("done","cancelled")')
    }

    query = query.limit(10)
    const { data: matches } = await query
    const found = matches ?? []

    if (found.length === 0) {
      return { ok: false, reason: 'not_found', parsed: cmd }
    }
    if (found.length > 1) {
      return { ok: false, reason: 'multiple_matches', matches: found, parsed: cmd }
    }
    target = found[0]
  }

  if (!target) return { ok: false, reason: 'not_found', parsed: cmd }

  // ── APLICAR OPERAÇÃO ──────────────────────────────────────────────────────

  switch (cmd.intent) {

    case 'delete': {
      await supabase.from(table).delete().eq('id', target.id)
      return { ok: true, action: 'deleted', appointment: target, parsed: cmd }
    }

    case 'mark_cancelled': {
      const { data } = await supabase
        .from(table).update({ status: 'cancelled' }).eq('id', target.id).select().single()
      return { ok: true, action: 'cancelled', appointment: data, parsed: cmd }
    }

    case 'mark_done': {
      const { data } = await supabase
        .from(table).update({ status: 'done' }).eq('id', target.id).select().single()
      return { ok: true, action: 'done', appointment: data, parsed: cmd }
    }

    case 'update_date': {
      if (!cmd.newDate) return { ok: false, reason: 'no_value', parsed: cmd }
      const { data } = await supabase
        .from(table).update({ date: cmd.newDate }).eq('id', target.id).select().single()
      return { ok: true, action: 'rescheduled', appointment: data, parsed: cmd }
    }

    case 'update_time': {
      if (cmd.newTime === undefined) return { ok: false, reason: 'no_value', parsed: cmd }
      const { data } = await supabase
        .from(table).update({ time: cmd.newTime }).eq('id', target.id).select().single()
      return { ok: true, action: 'rescheduled', appointment: data, parsed: cmd }
    }

    case 'update_both': {
      const updates: any = {}
      if (cmd.newDate) updates.date = cmd.newDate
      if (cmd.newTime !== undefined) updates.time = cmd.newTime
      const { data } = await supabase
        .from(table).update(updates).eq('id', target.id).select().single()
      return { ok: true, action: 'rescheduled', appointment: data, parsed: cmd }
    }

    case 'add_note': {
      const existingDesc = target.description ?? ''
      const note = cmd.note ?? ''
      const newDesc = existingDesc
        ? `${existingDesc}\n${note}`
        : note
      const { data } = await supabase
        .from(table).update({ description: newDesc }).eq('id', target.id).select().single()
      return { ok: true, action: 'noted', appointment: data, parsed: cmd }
    }

    default:
      return { ok: false, reason: 'no_value', parsed: cmd }
  }
}
