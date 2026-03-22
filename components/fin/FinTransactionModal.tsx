'use client'
import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, X, TrendingUp, TrendingDown, ArrowLeftRight, Check, ChevronRight, Edit3, Loader2 } from 'lucide-react'
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

export default function FinTransactionModal({ open, onClose, onSaved, accounts, categories, initial }: Props) {
  const [step,      setStep]      = useState<'voice'|'saving'|'success'|'confirm'|'form'>('voice')
  const [tab,       setTab]       = useState<'expense'|'income'|'transfer'>('expense')
  const [form,      setForm]      = useState<any>({})
  const [saving,    setSaving]    = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [voiceData, setVoiceData] = useState<any>(null)
  const [toastMsg,  setToastMsg]  = useState<{ type: 'expense'|'income'; amount: number; desc: string } | null>(null)
  const recogRef = useRef<any>(null)

  useEffect(() => {
    if (open) {
      if (initial?.id) {
        setTab(initial.type ?? 'expense')
        setForm(initial)
        setStep('form')
      } else if (initial && initial.amount) {
        setTab(initial.type ?? 'expense')
        setForm({ ...initial, date: initial.date ?? today(), status: 'confirmed' })
        setVoiceData(initial)
        setStep('confirm')
      } else {
        setTab(initial?.type ?? 'expense')
        setForm({ date: today(), status: 'confirmed', ...(initial ?? {}) })
        setStep('voice')
      }
      setVoiceText('')
      setListening(false)
      setToastMsg(null)
    }
  }, [open, initial])

  const resolveCategory = (name: string) => {
    if (!name) return null
    const lower = name.toLowerCase()
    return categories.find(c =>
      c.name.toLowerCase() === lower ||
      c.name.toLowerCase().includes(lower) ||
      lower.includes(c.name.toLowerCase())
    ) ?? null
  }

  const resolveAccount = (type: string | null) => {
    if (!type) return accounts[0] ?? null
    return accounts.find(a => a.type === type) ?? accounts[0] ?? null
  }

  const cats    = categories.filter(c => !c.parent_id && c.type === (tab === 'transfer' ? 'expense' : tab))
  const subCats = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  const handleSave = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    await fetch('/api/fin/transactions', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: tab }),
    })
    setSaving(false)
    onClose()
    onSaved()
  }

  // ─── VOZ ─────────────────────────────────────────────────────────────────────
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

      const res = await fetch('/api/fin/voice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).then(r => r.json())

      if (res.amount > 0) {
        setStep('saving')
        const saved = await fetch('/api/fin/voice', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }).then(r => r.json())

        if (saved.ok) {
          setToastMsg({ type: res.type, amount: res.amount, desc: res.description })
          setStep('success')
          onSaved()
          setTimeout(() => { onClose() }, 2200)
        } else {
          const cat     = resolveCategory(res.suggestedCategoryName)
          const account = resolveAccount(res.suggestedAccountType)
          setTab(res.type)
          setForm({
            type: res.type, amount: res.amount, description: res.description,
            date: res.date, status: 'confirmed', voice_input: text,
            category_id: cat?.id ?? '', account_id: account?.id ?? '',
          })
          setVoiceData(res)
          setStep('confirm')
        }
      } else {
        const cat     = resolveCategory(res.suggestedCategoryName)
        const account = resolveAccount(res.suggestedAccountType)
        setTab(res.type)
        setForm({
          type: res.type, amount: res.amount, description: res.description,
          date: res.date, status: 'confirmed', voice_input: text,
          category_id: cat?.id ?? '', account_id: account?.id ?? '',
        })
        setVoiceData(res)
        setStep('confirm')
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
          <Loader2 size={44} className="text-blue-500 animate-spin" />
          <div className="text-center">
            <p className="text-white font-semibold">Salvando lançamento...</p>
            <p className="text-gray-500 text-xs mt-1">"{voiceText}"</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── SUCESSO ─────────────────────────────────────────────────────────────────
  if (step === 'success' && toastMsg) {
    const isExpense = toastMsg.type === 'expense'
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl p-8 flex flex-col items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isExpense ? 'bg-red-950' : 'bg-green-950'}`}>
            <Check size={40} className={isExpense ? 'text-red-400' : 'text-green-400'} />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">Lançamento registrado!</p>
            <p className={`text-2xl font-bold mt-1 ${isExpense ? 'text-red-300' : 'text-green-300'}`}>
              {isExpense ? '−' : '+'}{formatCurrency(toastMsg.amount)}
            </p>
            <p className="text-gray-400 text-sm mt-1">{toastMsg.desc}</p>
          </div>
          <div className="flex gap-1 mt-1">
            {[0,1,2].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full ${isExpense ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── TELA CONFIRMAÇÃO ────────────────────────────────────────────────────────
  if (step === 'confirm') {
    const isExpense = tab === 'expense'
    const cat = categories.find(c => c.id === form.category_id)
    const acc = accounts.find(a => a.id === form.account_id)
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl">
          <div className="px-5 pt-5 pb-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Confirmar Lançamento</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15} /></button>
          </div>

          {voiceText && (
            <div className="mx-5 mt-4 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <span className="text-base">🎤</span>
              <p className="text-xs text-gray-400 italic">"{voiceText}"</p>
            </div>
          )}

          <div className="p-5 space-y-3">
            <div className={`rounded-xl p-4 flex items-center gap-3 ${isExpense ? 'bg-red-950 border border-red-900' : 'bg-green-950 border border-green-900'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpense ? 'bg-red-900' : 'bg-green-900'}`}>
                {isExpense ? <TrendingDown size={20} className="text-red-400" /> : <TrendingUp size={20} className="text-green-400" />}
              </div>
              <div>
                <p className="text-xs text-gray-400">{isExpense ? 'DESPESA' : 'RECEITA'}</p>
                <p className={`text-2xl font-bold ${isExpense ? 'text-red-300' : 'text-green-300'}`}>
                  {form.amount > 0 ? formatCurrency(form.amount) : <span className="text-gray-500 text-base">Valor não detectado</span>}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <span className="text-xs text-gray-500">Descrição</span>
                <span className="text-sm font-medium text-gray-200">{form.description || '—'}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <span className="text-xs text-gray-500">Categoria</span>
                <span className="text-sm font-medium text-gray-200">
                  {cat ? cat.name : <span className="text-yellow-400 text-xs">Não detectada</span>}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <span className="text-xs text-gray-500">Conta</span>
                <span className="text-sm font-medium text-gray-200">
                  {acc ? acc.name : <span className="text-yellow-400 text-xs">Nenhuma conta</span>}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <span className="text-xs text-gray-500">Data</span>
                <span className="text-sm font-medium text-gray-200">
                  {form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
            </div>

            {!form.amount && (
              <div className="bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3 text-xs text-yellow-400">
                ⚠️ Valor não detectado. Clique em "Editar" para preencher.
              </div>
            )}
          </div>

          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => setStep('form')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-800 transition-colors">
              <Edit3 size={14} /> Editar
            </button>
            <button onClick={handleSave} disabled={saving || !form.amount}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : <><Check size={16} /> Confirmar</>}
            </button>
          </div>

          <div className="border-t border-gray-800 px-5 py-3">
            <button onClick={() => { setStep('voice'); setVoiceText('') }}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <Mic size={12} /> Falar novamente
            </button>
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
            <h3 className="text-base font-bold text-white">Novo Lançamento</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15} /></button>
          </div>

          <div className="p-6 flex flex-col items-center">
            <button onClick={listening ? () => recogRef.current?.stop() : startVoice}
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-all shadow-xl ${
                listening
                  ? 'bg-blue-600 animate-pulse shadow-blue-500/30'
                  : 'bg-gray-800 border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-700'
              }`}>
              {listening ? <MicOff size={36} className="text-white" /> : <Mic size={36} className="text-gray-300" />}
            </button>

            {listening ? (
              <div className="text-center">
                <p className="text-blue-400 font-semibold text-sm mb-1">Ouvindo... fale agora!</p>
                <p className="text-gray-500 text-xs">O lançamento será salvo automaticamente</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 font-semibold text-sm mb-2">Toque para falar</p>
                <p className="text-gray-600 text-xs mb-3">O lançamento é salvo automaticamente</p>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-gray-500">"Paguei fornecedor dois mil reais"</p>
                  <p className="text-xs text-gray-500">"Gastei quinhentos de combustível"</p>
                  <p className="text-xs text-gray-500">"Recebi cinco mil de venda"</p>
                  <p className="text-xs text-gray-500">"Paguei DAS de R$ 350"</p>
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

  // ─── FORMULÁRIO COMPLETO ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
          <h3 className="text-base font-bold text-white">{form.id ? 'Editar' : 'Novo'} Lançamento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15} /></button>
        </div>

        <div className="flex gap-1.5 px-5 pt-4">
          {([['expense','Despesa'],['income','Receita'],['transfer','Transferência']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                tab === k
                  ? k === 'expense' ? 'bg-red-600 text-white' : k === 'income' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400'
              }`}>
              {k === 'expense' ? <TrendingDown size={11} className="inline mr-1" /> : k === 'income' ? <TrendingUp size={11} className="inline mr-1" /> : <ArrowLeftRight size={11} className="inline mr-1" />}
              {l}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Valor (R$)</label>
            <input type="number" step="0.01" placeholder="0,00"
              value={form.amount ?? ''}
              onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descrição</label>
            <input type="text" placeholder="Ex: Fornecedor XYZ, Salário funcionário..."
              value={form.description ?? ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</label>
            <input type="date" value={form.date ?? today()}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
            <select value={form.status ?? 'confirmed'}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
              <option value="confirmed">Confirmado (já aconteceu)</option>
              <option value="pending">Pendente (ainda não pago)</option>
              <option value="scheduled">Agendado (futuro)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoria</label>
            <select value={form.category_id ?? ''}
              onChange={e => setForm({ ...form, category_id: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
              <option value="">Sem categoria</option>
              {cats.map(c => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name}</option>
                  {subCats(c.id).map(s => <option key={s.id} value={s.id}>— {s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conta</label>
            <select value={form.account_id ?? ''}
              onChange={e => setForm({ ...form, account_id: e.target.value })}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
              <option value="">Selecione a conta</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {tab === 'transfer' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conta destino</label>
              <select value={form.to_account_id ?? ''}
                onChange={e => setForm({ ...form, to_account_id: e.target.value })}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Selecione destino</option>
                {accounts.filter(a => a.id !== form.account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5 sticky bottom-0 bg-gray-900 pt-2 border-t border-gray-800">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
