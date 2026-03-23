// Parser de voz para compromissos em português do Brasil

export interface ParsedAppointment {
  title: string
  date: string
  time: string | null
  type: string
  voice_input: string
}

const TYPE_LABELS: Record<string, string> = {
  meeting:     'Reunião',
  visit:       'Visita',
  call:        'Ligação',
  reminder:    'Lembrete',
  deadline:    'Prazo',
  lunch:       'Almoço',
  appointment: 'Consulta',
}

const WEEKDAYS: { pattern: RegExp; day: number }[] = [
  { pattern: /\bdomingo\b/,              day: 0 },
  { pattern: /\bsegunda[\s-]?feira\b|\bsegunda\b/, day: 1 },
  { pattern: /\bter[cç]a[\s-]?feira\b|\bter[cç]a\b/, day: 2 },
  { pattern: /\bquarta[\s-]?feira\b|\bquarta\b/, day: 3 },
  { pattern: /\bquinta[\s-]?feira\b|\bquinta\b/, day: 4 },
  { pattern: /\bsexta[\s-]?feira\b|\bsexta\b/, day: 5 },
  { pattern: /\bs[aá]bado\b/,            day: 6 },
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

function nextWeekday(now: Date, targetDay: number): Date {
  const d = new Date(now)
  const diff = (targetDay - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d
}

function parseDate(t: string, now: Date): string {
  const isoNow = now.toISOString().split('T')[0]

  if (/\bhoje\b/.test(t)) return isoNow

  if (/\bdepois de amanh[ãa]\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  }

  if (/\bamanh[ãa]\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  // próxim(a|o) + dia da semana
  const nextMatch = t.match(/pr[oó]xim[ao]\s+(\w+[\s-]?\w*)/)
  if (nextMatch) {
    for (const { pattern, day } of WEEKDAYS) {
      if (pattern.test(nextMatch[1])) {
        const d = new Date(now)
        const diff = (day - d.getDay() + 7) % 7 || 7
        d.setDate(d.getDate() + diff)
        return d.toISOString().split('T')[0]
      }
    }
  }

  // dia da semana sozinho
  for (const { pattern, day } of WEEKDAYS) {
    if (pattern.test(t)) {
      return nextWeekday(now, day).toISOString().split('T')[0]
    }
  }

  // "dia 28 de abril" ou "dia 28"
  const dayMonthMatch = t.match(/dia\s+(\d{1,2})(?:\s+de\s+(\w+))?/)
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1])
    let month = now.getMonth() + 1
    if (dayMonthMatch[2]) {
      for (const { pattern, month: m } of MONTHS_MAP) {
        if (pattern.test(dayMonthMatch[2])) { month = m; break }
      }
    }
    let year = now.getFullYear()
    // se o dia já passou neste mês, vai pro próximo
    if (month === now.getMonth() + 1 && day < now.getDate()) year = year
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  // "28/03" ou "28/3"
  const slashMatch = t.match(/(\d{1,2})\/(\d{1,2})/)
  if (slashMatch) {
    return `${now.getFullYear()}-${String(parseInt(slashMatch[2])).padStart(2,'0')}-${String(parseInt(slashMatch[1])).padStart(2,'0')}`
  }

  return isoNow
}

function parseTime(t: string): string | null {
  if (/meio[\s-]?dia/.test(t))   return '12:00'
  if (/meia[\s-]?noite/.test(t)) return '00:00'

  // "às 9", "9h", "9:30", "9h30", "14:00"
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

  if (/de manh[ãa]/.test(t) || /pela manh[ãa]/.test(t)) return '09:00'
  if (/à tarde|pela tarde/.test(t))                       return '14:00'
  if (/à noite|pela noite/.test(t))                       return '19:00'

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

export function parseAppointmentVoice(text: string): ParsedAppointment {
  const t    = text.toLowerCase().trim()
  const now  = new Date()
  const date = parseDate(t, now)
  const time = parseTime(t)
  const type = parseType(t)

  // Remove ruído para extrair título limpo
  let title = t
  // Remove data
  title = title.replace(/\b(hoje|amanh[ãa]|depois de amanh[ãa])\b/g, '')
  title = title.replace(/pr[oó]xim[ao]\s+\w+[\s-]?\w*/g, '')
  title = title.replace(/\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)[\s-]?feira?\b/g, '')
  title = title.replace(/dia\s+\d{1,2}(?:\s+de\s+\w+)?/g, '')
  title = title.replace(/\d{1,2}\/\d{1,2}/g, '')
  // Remove hora
  title = title.replace(/(?:às?\s+)?\d{1,2}(?::\d{2}|h\d{0,2})?(?:\s*(?:h(?:oras?)?))?(?:\s+(?:da\s+)?(?:manh[ãa]|tarde|noite))?/g, '')
  title = title.replace(/\b(meio[\s-]?dia|meia[\s-]?noite|de manh[ãa]|à tarde|à noite)\b/g, '')
  // Remove verbos de ação
  title = title.replace(/\b(agendar|marcar|colocar|adicionar|criar|anotar|lembrar)\b/g, '')
  // Remove palavras de tipo
  title = title.replace(/\b(reuni[aã]o|visita|liga[cç][aã]o|ligar|lembrete|prazo|almo[cç]o|consulta|compromisso)\b/g, '')
  // Preposições soltas
  title = title.replace(/\b(de|do|da|no|na|em|com|e|às?|para|pelo|pela|um|uma|o|a)\b/g, ' ')
  title = title.replace(/\s+/g, ' ').trim()

  if (!title || title.length < 3) {
    // Tenta manter "com X" como título
    const comMatch = text.toLowerCase().match(/com\s+([\w\s]+?)(?:\s+(?:hoje|amanh|dia|\d|segunda|terça|quarta|quinta|sexta|às?)|$)/)
    title = comMatch ? `${TYPE_LABELS[type]} com ${comMatch[1].trim()}` : TYPE_LABELS[type] || 'Compromisso'
  } else {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  return { title, date, time, type, voice_input: text }
}
