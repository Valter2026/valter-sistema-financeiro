'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, X, Check, ChevronRight, Loader2,
  Calendar, Trash2, Clock, CalendarCheck, CalendarX,
  FileText, CalendarDays, AlertCircle
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: any
}

const TYPE_LABELS: Record<string, string> = {
  meeting: 'Reunião', visit: 'Visita', call: 'Ligação',
  reminder: 'Lembrete', deadline: 'Prazo', lunch: 'Almoço', appointment: 'Consulta',
}
const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'done',      label: 'Realizado' },
]

type Step = 'voice' | 'saving' | 'success' | 'form' | 'disambiguate' | 'error'

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  created:     { icon: Check,        color: 'text-blue-400',    label: 'Compromisso agendado!',      bg: 'bg-blue-950'   },
  deleted:     { icon: Trash2,       color: 'text-red-400',     label: 'Compromisso excluído!',      bg: 'bg-red-950'    },
  cancelled:   { icon: CalendarX,    color: 'text-orange-400',  label: 'Compromisso cancelado!',     bg: 'bg-orange-950' },
  done:        { icon: CalendarCheck,color: 'text-green-400',   label: 'Marcado como realizado!',    bg: 'bg-green-950'  },
  rescheduled: { icon: CalendarDays, color: 'text-violet-400',  label: 'Compromisso remarcado!',     bg: 'bg-violet-950' },
  noted:       { icon: FileText,     color: 'text-yellow-400',  label: 'Observação adicionada!',     bg: 'bg-yellow-950' },
}

const EXAMPLES = [
  '"Reunião com fornecedor amanhã às 14h"',
  '"Excluir a visita de sexta"',
  '"Remarcar a reunião do banco para quinta às 10h"',
  '"Mudar o horário da ligação para as 16h"',
  '"Cancelar o almoço de amanhã"',
  '"Adicionar observação na consulta: trazer documentos"',
  '"Marcar como feito a reunião de hoje"',
]

const today = () => new Date().toISOString().split('T')[0]

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function FinAppointmentModal({ open, onClose, onSaved, initial }: Props) {
  const [step,      setStep]      = useState<Step>('voice')
  const [form,      setForm]      = useState<any>({})
  const [saving,    setSaving]    = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [result,    setResult]    = useState<any>(null)
  const [matches,   setMatches]   = useState<any[]>([])
  const [errorMsg,  setErrorMsg]  = useState('')
  const recogRef = useRef<any>(null)

  useEffect(() => {
    if (open) {
      if (initial?.id) { setForm(initial); setStep('form') }
      else { setForm({ date: today(), status: 'scheduled', type: 'meeting', ...(initial ?? {}) }); setStep('voice') }
      setVoiceText(''); setListening(false); setResult(null); setMatches([]); setErrorMsg('')
    }
  }, [open, initial])

  const handleSave = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    await fetch('/api/fin/appointments', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onClose(); onSaved()
  }

  const executeVoice = async (text: string, forceId?: string) => {
    setStep('saving')
    const res = await fetch('/api/fin/appointments/voice', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, forceId }),
    }).then(r => r.json())

    if (res.ok) {
      setResult(res)
      setStep('success')
      onSaved()
      setTimeout(() => onClose(), 2500)
    } else if (res.reason === 'multiple_matches') {
      setMatches(res.matches ?? [])
      setStep('disambiguate')
    } else if (res.reason === 'not_found') {
      setErrorMsg('Nenhum compromisso encontrado. Deseja criar um novo?')
      setStep('error')
    } else {
      setErrorMsg('Não consegui entender o valor do compromisso. Preencha manualmente.')
      setStep('error')
    }
  }

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Seu navegador não suporta reconhecimento de voz.'); return }
    const rec = new SR()
    rec.lang = 'pt-BR'; rec.continuous = false; rec.interimResults = false
    recogRef.current = rec
    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      executeVoice(text)
    }
    rec.start()
  }

  if (!open) return null

  // ── SALVANDO ─────────────────────────────────────────────────────────────
  if (step === 'saving') return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl p-10 flex flex-col items-center gap-4">
        <Loader2 size={44} className="text-blue-500 animate-spin" />
        <div className="text-center">
          <p className="text-white font-semibold">Processando comando...</p>
          <p className="text-gray-500 text-xs mt-1 italic">"{voiceText}"</p>
        </div>
      </div>
    </div>
  )

  // ── SUCESSO ───────────────────────────────────────────────────────────────
  if (step === 'success' && result) {
    const cfg = ACTION_CONFIG[result.action] ?? ACTION_CONFIG.created
    const Icon = cfg.icon
    const appt = result.appointment
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl p-8 flex flex-col items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${cfg.bg}`}>
            <Icon size={40} className={cfg.color} />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{cfg.label}</p>
            {appt && (
              <>
                <p className={`font-semibold mt-1 ${cfg.color}`}>{appt.title}</p>
                {appt.date && (
                  <p className="text-gray-400 text-sm mt-0.5">
                    {fmtDate(appt.date)}{appt.time ? ` às ${appt.time}` : ''}
                  </p>
                )}
                {result.action === 'noted' && appt.description && (
                  <p className="text-gray-500 text-xs mt-1 italic">"{appt.description.split('\n').pop()}"</p>
                )}
              </>
            )}
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full ${cfg.color.replace('text-','bg-')} animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── DESAMBIGUAÇÃO ─────────────────────────────────────────────────────────
  if (step === 'disambiguate') return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Qual compromisso?</h3>
            <p className="text-gray-500 text-xs mt-0.5">Encontrei vários. Toque para confirmar.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15}/></button>
        </div>
        <div className="p-3 space-y-2">
          {matches.map(m => (
            <button key={m.id} onClick={() => executeVoice(voiceText, m.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-left transition-colors">
              <Calendar size={16} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{m.title}</p>
                <p className="text-gray-500 text-xs">{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ''}</p>
              </div>
              <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>
        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  // ── ERRO ──────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl p-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-800">
          <AlertCircle size={32} className="text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">{errorMsg}</p>
          <p className="text-gray-600 text-xs mt-1 italic">"{voiceText}"</p>
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={() => setStep('voice')} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
            Tentar novamente
          </button>
          <button onClick={() => setStep('form')} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            Preencher manual
          </button>
        </div>
      </div>
    </div>
  )

  // ── TELA DE VOZ ───────────────────────────────────────────────────────────
  if (step === 'voice') return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl">
        <div className="px-5 pt-5 pb-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Agenda por Voz</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15}/></button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <button onClick={listening ? () => recogRef.current?.stop() : startVoice}
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-all shadow-xl ${
              listening ? 'bg-blue-600 animate-pulse shadow-blue-500/30'
                        : 'bg-gray-800 border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-700'
            }`}>
            {listening ? <MicOff size={36} className="text-white"/> : <Mic size={36} className="text-gray-300"/>}
          </button>

          {listening ? (
            <div className="text-center">
              <p className="text-blue-400 font-semibold text-sm mb-1">Ouvindo...</p>
              <p className="text-gray-500 text-xs">Fale o comando de agenda</p>
            </div>
          ) : (
            <div className="text-center w-full">
              <p className="text-gray-300 font-semibold text-sm mb-3">Toque e diga o comando</p>
              <div className="space-y-1.5 text-left bg-gray-800/50 rounded-xl p-3">
                {EXAMPLES.map((ex, i) => (
                  <p key={i} className="text-xs text-gray-500">{ex}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 px-5 py-3">
          <button onClick={() => setStep('form')}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Preencher manualmente <ChevronRight size={12}/>
          </button>
        </div>
      </div>
    </div>
  )

  // ── FORMULÁRIO ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
          <h3 className="text-base font-bold text-white">{form.id ? 'Editar' : 'Novo'} Compromisso</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15}/></button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Título</label>
            <input type="text" placeholder="Ex: Reunião com fornecedor..."
              value={form.title ?? ''}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</label>
            <select value={form.type ?? 'meeting'} onChange={e => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</label>
              <input type="date" value={form.date ?? today()} onChange={e => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hora</label>
              <input type="time" value={form.time ?? ''} onChange={e => setForm({ ...form, time: e.target.value || null })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
            <select value={form.status ?? 'scheduled'} onChange={e => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Observações</label>
            <textarea placeholder="Detalhes, notas importantes..." value={form.description ?? ''}
              onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5 sticky bottom-0 bg-gray-900 pt-2 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
