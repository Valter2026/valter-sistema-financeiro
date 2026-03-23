'use client'
import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, X, Check, ChevronRight, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: any
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

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'done',      label: 'Realizado' },
]

const today = () => new Date().toISOString().split('T')[0]

export default function PfAppointmentModal({ open, onClose, onSaved, initial }: Props) {
  const [step,      setStep]      = useState<'voice'|'saving'|'success'|'form'>('voice')
  const [form,      setForm]      = useState<any>({})
  const [saving,    setSaving]    = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [toastMsg,  setToastMsg]  = useState<{ title: string; date: string; time: string | null } | null>(null)
  const recogRef = useRef<any>(null)

  useEffect(() => {
    if (open) {
      if (initial?.id) {
        setForm(initial)
        setStep('form')
      } else {
        setForm({ date: today(), status: 'scheduled', type: 'meeting', ...(initial ?? {}) })
        setStep('voice')
      }
      setVoiceText('')
      setListening(false)
      setToastMsg(null)
    }
  }, [open, initial])

  const handleSave = async () => {
    if (!form.title || !form.date) return
    setSaving(true)
    await fetch('/api/pf/appointments', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onClose()
    onSaved()
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

    rec.onresult = async (e: any) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      setStep('saving')

      const saved = await fetch('/api/pf/appointments/voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).then(r => r.json())

      if (saved.ok) {
        const p = saved.parsed
        setToastMsg({ title: p.title, date: p.date, time: p.time })
        setStep('success')
        onSaved()
        setTimeout(() => { onClose() }, 2200)
      } else {
        const p = saved.parsed ?? {}
        setForm({
          title: p.title ?? '',
          date: p.date ?? today(),
          time: p.time ?? '',
          type: p.type ?? 'meeting',
          status: 'scheduled',
          voice_input: text,
        })
        setStep('form')
      }
    }
    rec.start()
  }

  if (!open) return null

  // ─── SALVANDO ────────────────────────────────────────────────────────────────
  if (step === 'saving') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl p-10 flex flex-col items-center gap-4">
          <Loader2 size={44} className="text-emerald-500 animate-spin" />
          <div className="text-center">
            <p className="text-white font-semibold">Agendando compromisso...</p>
            <p className="text-gray-500 text-xs mt-1">"{voiceText}"</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── SUCESSO ─────────────────────────────────────────────────────────────────
  if (step === 'success' && toastMsg) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl p-8 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-950">
            <Check size={40} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">Compromisso agendado!</p>
            <p className="text-emerald-300 font-semibold mt-1">{toastMsg.title}</p>
            <p className="text-gray-400 text-sm mt-1">
              {new Date(toastMsg.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              {toastMsg.time ? ` às ${toastMsg.time}` : ''}
            </p>
          </div>
          <div className="flex gap-1 mt-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── TELA DE VOZ ─────────────────────────────────────────────────────────────
  if (step === 'voice') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl">
          <div className="px-5 pt-5 pb-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Novo Compromisso</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15} /></button>
          </div>

          <div className="p-6 flex flex-col items-center">
            <button onClick={listening ? () => recogRef.current?.stop() : startVoice}
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-all shadow-xl ${
                listening
                  ? 'bg-emerald-600 animate-pulse shadow-emerald-500/30'
                  : 'bg-gray-800 border-2 border-gray-700 hover:border-emerald-500 hover:bg-gray-700'
              }`}>
              {listening ? <MicOff size={36} className="text-white" /> : <Mic size={36} className="text-gray-300" />}
            </button>

            {listening ? (
              <div className="text-center">
                <p className="text-emerald-400 font-semibold text-sm mb-1">Ouvindo... fale agora!</p>
                <p className="text-gray-500 text-xs">O compromisso será agendado automaticamente</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 font-semibold text-sm mb-2">Toque para falar</p>
                <p className="text-gray-600 text-xs mb-3">O compromisso é agendado automaticamente</p>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-gray-500">"Consulta médica amanhã às 9h"</p>
                  <p className="text-xs text-gray-500">"Reunião com contador sexta"</p>
                  <p className="text-xs text-gray-500">"Almoço com família domingo"</p>
                  <p className="text-xs text-gray-500">"Lembrete de pagar conta dia 10"</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 px-5 py-3">
            <button onClick={() => setStep('form')}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Preencher manualmente <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── FORMULÁRIO ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
          <h3 className="text-base font-bold text-white">{form.id ? 'Editar' : 'Novo'} Compromisso</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Título</label>
            <input type="text" placeholder="Ex: Consulta médica, Reunião com banco..."
              value={form.title ?? ''}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</label>
            <select value={form.type ?? 'meeting'}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</label>
              <input type="date" value={form.date ?? today()}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hora</label>
              <input type="time" value={form.time ?? ''}
                onChange={e => setForm({ ...form, time: e.target.value || null })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
            <select value={form.status ?? 'scheduled'}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descrição (opcional)</label>
            <textarea placeholder="Detalhes adicionais..."
              value={form.description ?? ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5 sticky bottom-0 bg-gray-900 pt-2 border-t border-gray-800">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
