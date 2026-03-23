// Parser de voz para compromissos em português do Brasil
// Suporta: criar, excluir, remarcar, mudar horário, adicionar nota, marcar como feito/cancelado

export interface ParsedAppointment {
  title: string
  date: string
  time: string | null
  type: string
  voice_input: string
}

export type AppointmentIntent =
  | 'create'
  | 'delete'
  | 'update_date'
  | 'update_time'
  | 'update_both'
  | 'add_note'
  | 'mark_done'
  | 'mark_cancelled'

export interface ParsedAppointmentCommand {
  intent: AppointmentIntent
  // Para create
  title?: string
  type?: string
  // Comum
  date?: string
  time?: string | null
  // Para busca de compromisso existente
  searchQuery?: string
  searchDate?: string
  // Para updates
  newDate?: string
  newTime?: string | null
  note?: string
  voice_input: string
}

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<string, string> = {
  meeting:     'Reunião',
  visit:       'Visita',
  call:        'Ligação',
  reminder:    'Lembrete',
  deadline:    'Prazo',
  lunch:       'Almoço',
  appointment: 'Consulta',
}

const WEEKDAYS: { pattern: RegExp; day: number; name: string }[] = [
  { pattern: /\bdomingo\b/,                              day: 0, name: 'domingo'  },
  { pattern: /\bsegunda[\s-]?feira\b|\bsegunda\b/,       day: 1, name: 'segunda'  },
  { pattern: /\bter[cç]a[\s-]?feira\b|\bter[cç]a\b/,    day: 2, name: 'terça'    },
  { pattern: /\bquarta[\s-]?feira\b|\bquarta\b/,         day: 3, name: 'quarta'   },
  { pattern: /\bquinta[\s-]?feira\b|\bquinta\b/,         day: 4, name: 'quinta'   },
  { pattern: /\bsexta[\s-]?feira\b|\bsexta\b/,           day: 5, name: 'sexta'    },
  { pattern: /\bs[aá]bado\b/,                            day: 6, name: 'sábado'   },
]

const MONTHS_MAP: { pattern: RegExp; month: number }[] = [
  { pattern: /janeiro/,   month: 1  },
  { pattern: /fevereiro/, month: 2  },
  { pattern: /mar[cç]o/,  month: 3  },
  { pattern: /abril/,     month: 4  },
  { pattern: /maio/,      month: 5  },
  { pattern: /junho/,     month: 6  },
  { pattern: /julho/,     month: 7  },
  { pattern: /agosto/,    month: 8  },
  { pattern: /setembro/,  month: 9  },
  { pattern: /outubro/,   month: 10 },
  { pattern: /novembro/,  month: 11 },
  { pattern: /dezembro/,  month: 12 },
]

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────

function nextWeekday(now: Date, targetDay: number): Date {
  const d = new Date(now)
  const diff = (targetDay - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d
}

/** Extrai data — retorna null se nenhuma referência de data encontrada */
export function parseDateOrNull(t: string, now: Date): string | null {
  if (/\bhoje\b/.test(t)) return now.toISOString().split('T')[0]

  if (/\bdepois de amanh[ãa]\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  }
  if (/\bamanh[ãa]\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const nextMatch = t.match(/pr[oó]xim[ao]\s+(\w+[\s-]?\w*)/)
  if (nextMatch) {
    for (const { pattern, day } of WEEKDAYS) {
      if (pattern.test(nextMatch[1])) {
        const d = new Date(now)
        d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7 || 7))
        return d.toISOString().split('T')[0]
      }
    }
  }

  for (const { pattern, day } of WEEKDAYS) {
    if (pattern.test(t)) return nextWeekday(now, day).toISOString().split('T')[0]
  }

  const dayMonthMatch = t.match(/dia\s+(\d{1,2})(?:\s+de\s+(\w+))?/)
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1])
    let month = now.getMonth() + 1
    if (dayMonthMatch[2]) {
      for (const { pattern, month: m } of MONTHS_MAP) {
        if (pattern.test(dayMonthMatch[2])) { month = m; break }
      }
    }
    const year = now.getFullYear()
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  const slashMatch = t.match(/(\d{1,2})\/(\d{1,2})/)
  if (slashMatch) {
    return `${now.getFullYear()}-${String(parseInt(slashMatch[2])).padStart(2,'0')}-${String(parseInt(slashMatch[1])).padStart(2,'0')}`
  }

  return null
}

/** Extrai data — retorna hoje como fallback */
function parseDate(t: string, now: Date): string {
  return parseDateOrNull(t, now) ?? now.toISOString().split('T')[0]
}

export function parseTime(t: string): string | null {
  if (/meio[\s-]?dia/.test(t))   return '12:00'
  if (/meia[\s-]?noite/.test(t)) return '00:00'

  const m = t.match(/(?:às?\s+)?(\d{1,2})(?::(\d{2})|h(\d{2})?)?(?:\s*(?:h(?:oras?)?))?(?=\s|$|,|\.|\b)/)
  if (m) {
    let hour = parseInt(m[1])
    const min = m[2] ? parseInt(m[2]) : (m[3] ? parseInt(m[3]) : 0)
    if (hour < 1 || hour > 23) return null
    if (/\btarde\b/.test(t) && hour < 12) hour += 12
    if (/\bnoite\b/.test(t) && hour < 12) hour += 12
    if (/\bmanh[ãa]\b/.test(t) && hour === 12) hour = 0
    return `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`
  }

  if (/de manh[ãa]|pela manh[ãa]/.test(t)) return '09:00'
  if (/à tarde|pela tarde/.test(t))         return '14:00'
  if (/à noite|pela noite/.test(t))         return '19:00'

  return null
}

function parseType(t: string): string {
  if (/visita|visitar/.test(t))                                    return 'visit'
  if (/liga[cç][aã]o|ligar|telefonar|\bcall\b/.test(t))           return 'call'
  if (/\blembrete\b|lembrar/.test(t))                              return 'reminder'
  if (/prazo|entrega|vencimento|deadline/.test(t))                 return 'deadline'
  if (/almo[cç]o|almoçar/.test(t))                                 return 'lunch'
  if (/consulta|m[eé]dic[ao]|dentist/.test(t))                     return 'appointment'
  return 'meeting'
}

/**
 * Limpa texto para uso como searchQuery (busca no banco).
 * Remove artigos, preposições, data/hora soltas.
 */
function cleanSearchQuery(t: string): string {
  return t
    .replace(/\b(de|do|da|dos|das|no|na|nos|nas|em|com|e|às?|um|uma|o|a|os|as|para|pelo|pela|pelos|pelas|minha|meu)\b/g, ' ')
    .replace(/\bhoje\b|\bamanh[ãa]\b|\bdepois de amanh[ãa]\b/g, '')
    .replace(/\bpr[oó]xim[ao]\s+\w+[\s-]?\w*/g, '')
    .replace(/\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)[\s-]?feira?\b/g, '')
    .replace(/dia\s+\d{1,2}(?:\s+de\s+\w+)?/g, '')
    .replace(/\d{1,2}\/\d{1,2}/g, '')
    .replace(/(?:às?\s+)?\d{1,2}(?::\d{2}|h\d{0,2})?(?:\s*h(?:oras?)?)?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrai searchQuery e searchDate de um trecho de texto que identifica
 * um compromisso existente.
 */
function extractSearchInfo(segment: string, now: Date): { searchQuery: string; searchDate?: string } {
  const searchDate = parseDateOrNull(segment, now) ?? undefined
  const searchQuery = cleanSearchQuery(segment)
  return { searchQuery, searchDate }
}

// ─── INTENT DETECTION ─────────────────────────────────────────────────────────

const DELETE_RE      = /^(excluir|apagar|deletar|remover|delete)\b\s*/
const CANCELLED_RE   = /^(cancelar|cancela)\b\s*/
const DONE_RE        = /^(marcar como (feito|realizado|conclu[íi]do|pronto)|conclu[íi]r|finalizar|completar|já aconteceu|já foi realizada?|já fizemos)\b\s*/
const NOTE_RE        = /^(adicionar (observa[cç][aã]o|nota|descri[cç][aã]o|anota[cç][aã]o)|incluir (observa[cç][aã]o|nota|descri[cç][aã]o)|colocar (observa[cç][aã]o|nota)|anotar)\b\s*/
const RESCHEDULE_RE  = /^(remarcar|reagendar|adiar|antecipar|mover|mudar a data|alterar a data|mudar data|alterar data)\b\s*/
const TIME_CHANGE_RE = /^(mudar o hor[aá]rio|alterar o hor[aá]rio|trocar o hor[aá]rio|mudar hor[aá]rio|alterar hor[aá]rio|trocar hor[aá]rio|mudar a hora|alterar a hora)\b\s*/

/** Remove artigos iniciais ("a reunião" → "reunião", "o almoço" → "almoço") */
function stripLeadingArticles(t: string) {
  return t.replace(/^(a |o |as |os |um |uma )+/i, '').trim()
}

// ─── PARSERS DE INTENÇÃO ──────────────────────────────────────────────────────

function parseDeleteCommand(t: string, now: Date, raw: string, intent: 'delete' | 'mark_cancelled'): ParsedAppointmentCommand {
  const rest = stripLeadingArticles(t.replace(intent === 'delete' ? DELETE_RE : CANCELLED_RE, ''))
  const { searchQuery, searchDate } = extractSearchInfo(rest, now)
  return { intent, searchQuery, searchDate, voice_input: raw }
}

function parseDoneCommand(t: string, now: Date, raw: string): ParsedAppointmentCommand {
  const rest = stripLeadingArticles(t.replace(DONE_RE, ''))
  const { searchQuery, searchDate } = extractSearchInfo(rest, now)
  return { intent: 'mark_done', searchQuery, searchDate, voice_input: raw }
}

function parseNoteCommand(t: string, now: Date, raw: string): ParsedAppointmentCommand {
  const rest = t.replace(NOTE_RE, '')

  // Tenta extrair: "na/do/da/no [appointment]: [note]" ou "[appointment] que [note]"
  // Padrão: "observação na reunião: trazer contrato" ou "nota na consulta que é urgente"
  let searchQuery = ''
  let searchDate: string | undefined
  let note = ''

  // Separadores comuns para nota: ":", "que", "-", "sobre"
  const sepMatch = rest.match(/^(.*?)\s*(?::|que\s+|--?\s*|,\s*)(.*?)$/)
  if (sepMatch) {
    const left = stripLeadingArticles(sepMatch[1].replace(/^(na |no |da |do |des?a |des?o )/i, '').trim())
    note = sepMatch[2].trim()
    const info = extractSearchInfo(left, now)
    searchQuery = info.searchQuery
    searchDate = info.searchDate
  } else {
    // Sem separador — o texto todo é a nota; tenta identificar o compromisso por tipo
    const info = extractSearchInfo(rest, now)
    searchQuery = info.searchQuery
    searchDate = info.searchDate
    note = rest
  }

  return { intent: 'add_note', searchQuery, searchDate, note, voice_input: raw }
}

function parseRescheduleCommand(t: string, now: Date, raw: string): ParsedAppointmentCommand {
  const rest = t.replace(RESCHEDULE_RE, '')

  // Divide em: [target appointment] "para" [new value]
  const paraIdx = rest.lastIndexOf(' para ')
  let targetText: string
  let newValueText: string

  if (paraIdx !== -1) {
    targetText   = stripLeadingArticles(rest.slice(0, paraIdx).trim())
    newValueText = rest.slice(paraIdx + 6).trim()
  } else {
    // Sem "para": target = texto sem a data/hora; new value = data/hora encontrada
    targetText   = rest
    newValueText = rest
  }

  const { searchQuery, searchDate } = extractSearchInfo(targetText, now)
  const newDate = parseDateOrNull(newValueText, now) ?? undefined
  const newTime = parseTime(newValueText) ?? undefined

  const intent: AppointmentIntent =
    newDate && newTime ? 'update_both' :
    newTime            ? 'update_time' :
                         'update_date'

  return { intent, searchQuery, searchDate, newDate, newTime, voice_input: raw }
}

function parseTimeChangeCommand(t: string, now: Date, raw: string): ParsedAppointmentCommand {
  const rest = t.replace(TIME_CHANGE_RE, '')

  const paraIdx = rest.lastIndexOf(' para ')
  let targetText: string
  let newValueText: string

  if (paraIdx !== -1) {
    targetText   = stripLeadingArticles(rest.slice(0, paraIdx).trim())
    newValueText = rest.slice(paraIdx + 6).trim()
  } else {
    targetText   = rest
    newValueText = rest
  }

  const { searchQuery, searchDate } = extractSearchInfo(targetText, now)
  const newTime = parseTime(newValueText) ?? undefined
  const newDate = parseDateOrNull(newValueText, now) ?? undefined

  const intent: AppointmentIntent = (newDate && newTime) ? 'update_both' : 'update_time'

  return { intent, searchQuery, searchDate, newDate, newTime, voice_input: raw }
}

// ─── PARSER ORIGINAL (create) ─────────────────────────────────────────────────

export function parseAppointmentVoice(text: string): ParsedAppointment {
  const t    = text.toLowerCase().trim()
  const now  = new Date()
  const date = parseDate(t, now)
  const time = parseTime(t)
  const type = parseType(t)

  let title = t
  title = title.replace(/\b(hoje|amanh[ãa]|depois de amanh[ãa])\b/g, '')
  title = title.replace(/pr[oó]xim[ao]\s+\w+[\s-]?\w*/g, '')
  title = title.replace(/\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)[\s-]?feira?\b/g, '')
  title = title.replace(/dia\s+\d{1,2}(?:\s+de\s+\w+)?/g, '')
  title = title.replace(/\d{1,2}\/\d{1,2}/g, '')
  title = title.replace(/(?:às?\s+)?\d{1,2}(?::\d{2}|h\d{0,2})?(?:\s*(?:h(?:oras?)?))?(?:\s+(?:da\s+)?(?:manh[ãa]|tarde|noite))?/g, '')
  title = title.replace(/\b(meio[\s-]?dia|meia[\s-]?noite|de manh[ãa]|à tarde|à noite)\b/g, '')
  title = title.replace(/\b(agendar|marcar|colocar|adicionar|criar|anotar|lembrar)\b/g, '')
  title = title.replace(/\b(reuni[aã]o|visita|liga[cç][aã]o|ligar|lembrete|prazo|almo[cç]o|consulta|compromisso)\b/g, '')
  title = title.replace(/\b(de|do|da|no|na|em|com|e|às?|para|pelo|pela|um|uma|o|a)\b/g, ' ')
  title = title.replace(/\s+/g, ' ').trim()

  if (!title || title.length < 3) {
    const comMatch = text.toLowerCase().match(/com\s+([\w\s]+?)(?:\s+(?:hoje|amanh|dia|\d|segunda|terça|quarta|quinta|sexta|às?)|$)/)
    title = comMatch ? `${TYPE_LABELS[type]} com ${comMatch[1].trim()}` : TYPE_LABELS[type] || 'Compromisso'
  } else {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  return { title, date, time, type, voice_input: text }
}

// ─── PARSER PRINCIPAL ─────────────────────────────────────────────────────────

export function parseAppointmentVoiceCommand(text: string): ParsedAppointmentCommand {
  const t   = text.toLowerCase().trim()
  const now = new Date()

  if (DELETE_RE.test(t))      return parseDeleteCommand(t, now, text, 'delete')
  if (CANCELLED_RE.test(t))   return parseDeleteCommand(t, now, text, 'mark_cancelled')
  if (DONE_RE.test(t))        return parseDoneCommand(t, now, text)
  if (NOTE_RE.test(t))        return parseNoteCommand(t, now, text)
  if (RESCHEDULE_RE.test(t))  return parseRescheduleCommand(t, now, text)
  if (TIME_CHANGE_RE.test(t)) return parseTimeChangeCommand(t, now, text)

  // CREATE
  const created = parseAppointmentVoice(text)
  return {
    intent:      'create',
    title:       created.title,
    date:        created.date,
    time:        created.time,
    type:        created.type,
    voice_input: text,
  }
}
