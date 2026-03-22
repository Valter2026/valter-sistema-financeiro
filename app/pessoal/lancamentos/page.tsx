'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight, Mic, MicOff, Check, Clock } from 'lucide-react'
import PfTransactionModal from '@/components/pf/PfTransactionModal'

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  confirmed: { label: 'Confirmado', class: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
  pending:   { label: 'Pendente',   class: 'bg-yellow-950 text-yellow-400 border-yellow-800'   },
  scheduled: { label: 'Agendado',   class: 'bg-blue-950 text-blue-400 border-blue-800'         },
}

const TYPE_ICON: Record<string, any> = {
  income:   { icon: TrendingUp,       color: 'text-emerald-400' },
  expense:  { icon: TrendingDown,     color: 'text-red-400'     },
  transfer: { icon: ArrowLeftRight,   color: 'text-blue-400'    },
}

export default function PfLancamentosPage() {
  const [txs,      setTxs]      = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [cats,     setCats]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState<any>(null)
  const [tipo,     setTipo]     = useState<'todos'|'income'|'expense'>('todos')
  const [busca,    setBusca]    = useState('')
  const [listening,setListening]= useState(false)
  const [voiceText,setVoiceText]= useState('')
  const [voiceForm,setVoiceForm]= useState<any>(null)
  const recogRef = useRef<any>(null)

  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  const load = useCallback(async () => {
    setLoading(true)
    const [t, acc, cat] = await Promise.all([
      fetch(`/api/pf/transactions?month=${mes}&year=${ano}`).then(r => r.json()),
      fetch('/api/pf/accounts').then(r => r.json()),
      fetch('/api/pf/categories').then(r => r.json()),
    ])
    setTxs(Array.isArray(t) ? t : [])
    setAccounts(Array.isArray(acc) ? acc : [])
    setCats(Array.isArray(cat) ? cat : [])
    setLoading(false)
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return
    await fetch('/api/pf/transactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const handleConfirm = async (tx: any) => {
    await fetch('/api/pf/transactions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tx.id, status: 'confirmed' }) })
    load()
  }

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Navegador não suporta voz'); return }
    const rec = new SR()
    rec.lang = 'pt-BR'; rec.continuous = false; rec.interimResults = false
    recogRef.current = rec
    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)
    rec.onresult = async (e: any) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      const res = await fetch('/api/pf/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).then(r => r.json())
      setVoiceForm({ ...res, voice_input: text, status: 'confirmed', recurrence: 'single' })
      setEditing({ ...res, voice_input: text, status: 'confirmed', recurrence: 'single' })
      setModal(true)
    }
    rec.start()
  }

  const lista = txs
    .filter(t => tipo === 'todos' || t.type === tipo)
    .filter(t => !busca || (t.description ?? '').toLowerCase().includes(busca.toLowerCase()))

  const totalReceitas = txs.filter(t => t.type === 'income'   && t.status === 'confirmed').reduce((a, t) => a + Number(t.amount), 0)
  const totalGastos   = txs.filter(t => t.type === 'expense'  && t.status === 'confirmed').reduce((a, t) => a + Number(t.amount), 0)
  const resultado     = totalReceitas - totalGastos

  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Lançamentos</h2>
          <p className="text-gray-400 text-sm mt-1">{MONTHS[mes-1]}/{ano} · {txs.length} lançamento(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={startVoice}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${listening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
            {listening ? 'Ouvindo...' : 'Voz'}
          </button>
          <button onClick={() => { setEditing(null); setModal(true) }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      {voiceText && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-300">
          🎤 "{voiceText}"
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-950 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Receitas</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Gastos</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalGastos)}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-4 ${resultado >= 0 ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resultado</p>
          <p className={`text-xl font-bold ${resultado >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(resultado)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="flex gap-1">
          {([['todos','Todos'],['income','Receitas'],['expense','Gastos']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTipo(k)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                tipo === k ? 'bg-emerald-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => { const d = new Date(ano, mes-2, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white">‹</button>
          <span className="px-3 py-2 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl">{MONTHS[mes-1]}/{ano}</span>
          <button onClick={() => { const d = new Date(ano, mes, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white">›</button>
        </div>
        <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
      </div>

      {/* Lista */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div>{[...Array(6)].map((_,i) => <div key={i} className="h-14 bg-gray-800 animate-pulse border-b border-gray-700" />)}</div>
        ) : lista.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800 bg-gray-800/50">
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Data</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Descrição</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Categoria</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Conta</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Valor</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((tx, i) => {
                const cfg  = TYPE_ICON[tx.type] ?? TYPE_ICON.expense
                const Icon = cfg.icon
                const st   = STATUS_LABEL[tx.status] ?? STATUS_LABEL.confirmed
                return (
                  <tr key={tx.id ?? i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Icon size={13} className={cfg.color} />
                        <span className="text-gray-200 font-medium">{tx.description || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.category ? (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: tx.category.color ?? '#6b7280' }} />
                          {tx.category.icon} {tx.category.name}
                        </span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{tx.account?.name ?? '—'}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${tx.type === 'income' ? 'text-emerald-400' : tx.type === 'expense' ? 'text-red-400' : 'text-blue-400'}`}>
                      {tx.type === 'expense' ? '- ' : '+ '}{formatCurrency(Number(tx.amount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${st.class}`}>
                        {tx.status === 'confirmed' ? <Check size={9} /> : <Clock size={9} />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {tx.status !== 'confirmed' && (
                          <button onClick={() => handleConfirm(tx)} title="Confirmar"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-emerald-950 hover:text-emerald-400 transition-colors">
                            <Check size={13} />
                          </button>
                        )}
                        <button onClick={() => { setEditing(tx); setModal(true) }}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-700 hover:text-gray-200 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-950 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <PfTransactionModal
        open={modal}
        onClose={() => { setModal(false); setEditing(null); setVoiceText(''); setVoiceForm(null) }}
        onSaved={load}
        accounts={accounts}
        categories={cats}
        initial={editing}
      />
    </div>
  )
}
