'use client'
import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, X, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  accounts: any[]
  categories: any[]
  initial?: any
}

const today = () => new Date().toISOString().split('T')[0]

export default function PfTransactionModal({ open, onClose, onSaved, accounts, categories, initial }: Props) {
  const [tab,       setTab]       = useState<'expense'|'income'|'transfer'>('expense')
  const [form,      setForm]      = useState<any>({})
  const [saving,    setSaving]    = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [voiceHint, setVoiceHint] = useState('')
  const recogRef = useRef<any>(null)

  useEffect(() => {
    if (open) {
      if (initial) { setTab(initial.type ?? 'expense'); setForm(initial) }
      else setForm({ date: today(), status: 'confirmed', recurrence: 'single' })
    }
  }, [open, initial])

  const cats = categories.filter(c => !c.parent_id && c.type === (tab === 'transfer' ? 'expense' : tab))
  const subCats = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  const handleSave = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    await fetch('/api/pf/transactions', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: tab }),
    })
    setSaving(false)
    onClose()
    onSaved()
  }

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Seu navegador não suporta reconhecimento de voz.'); return }

    const rec = new SpeechRecognition()
    rec.lang = 'pt-BR'
    rec.continuous = false
    rec.interimResults = false
    recogRef.current = rec

    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)
    rec.onresult = async (e: any) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      setVoiceHint('Interpretando...')

      const res = await fetch('/api/pf/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).then(r => r.json())

      setTab(res.type)
      setForm((f: any) => ({
        ...f,
        amount:      res.amount || f.amount,
        description: res.description || f.description,
        date:        res.date || f.date,
        voice_input: text,
      }))
      setVoiceHint(`Detectado: ${res.type === 'expense' ? 'Gasto' : 'Receita'} · ${formatCurrency(res.amount)} · ${res.suggestedCategory || 'sem categoria'}`)
    }
    rec.start()
  }

  const stopVoice = () => { recogRef.current?.stop(); setListening(false) }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{form.id ? 'Editar' : 'Novo'} Lançamento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Voz */}
        <div className="px-6 pt-5">
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${listening ? 'border-emerald-500 bg-emerald-950' : 'border-gray-700 bg-gray-800'}`}>
            <button onClick={listening ? stopVoice : startVoice}
              className={`p-2.5 rounded-lg transition-colors ${listening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'}`}>
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <div className="flex-1 min-w-0">
              {listening ? (
                <p className="text-sm text-emerald-400 font-medium">Ouvindo... fale o lançamento</p>
              ) : voiceText ? (
                <>
                  <p className="text-xs text-gray-400 truncate">"{voiceText}"</p>
                  {voiceHint && <p className="text-xs text-emerald-400 mt-0.5">{voiceHint}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-500">Clique no microfone e fale: <span className="text-gray-400">"gastei 50 no mercado"</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4">
          {([['expense','Gasto','text-red-400'],['income','Receita','text-emerald-400'],['transfer','Transferência','text-blue-400']] as const).map(([k, l, c]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                tab === k
                  ? k === 'expense' ? 'bg-red-600 text-white' : k === 'income' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}>
              {k === 'expense' ? <TrendingDown size={12} className="inline mr-1" /> : k === 'income' ? <TrendingUp size={12} className="inline mr-1" /> : <ArrowLeftRight size={12} className="inline mr-1" />}
              {l}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Valor */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Valor (R$)</label>
            <input type="number" step="0.01" placeholder="0,00"
              value={form.amount ?? ''}
              onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descrição</label>
            <input type="text" placeholder="Ex: Supermercado, Salário..."
              value={form.description ?? ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          {/* Data */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</label>
            <input type="date" value={form.date ?? today()}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Categoria */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoria</label>
              <select value={form.category_id ?? ''}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                <option value="">Sem categoria</option>
                {cats.map(c => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                    {subCats(c.id).map(s => (
                      <option key={s.id} value={s.id}>— {s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Conta */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conta</label>
              <select value={form.account_id ?? ''}
                onChange={e => setForm({ ...form, account_id: e.target.value })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                <option value="">Selecione</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Recorrência */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo de Lançamento</label>
            <select value={form.recurrence ?? 'single'}
              onChange={e => setForm({ ...form, recurrence: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
              <option value="single">Avulso (único)</option>
              <option value="fixed">Fixo (todo mês)</option>
              <option value="installment">Parcelado</option>
            </select>
          </div>

          {form.recurrence === 'installment' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Número de Parcelas</label>
              <input type="number" min={2} max={60} placeholder="Ex: 12"
                value={form.installment_total ?? ''}
                onChange={e => setForm({ ...form, installment_total: parseInt(e.target.value) })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Situação</label>
            <select value={form.status ?? 'confirmed'}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
              <option value="confirmed">Confirmado (já aconteceu)</option>
              <option value="pending">Pendente (ainda não pago)</option>
              <option value="scheduled">Agendado (futuro)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
