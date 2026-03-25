'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Check, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight, Mic, MicOff, X, Download } from 'lucide-react'
import FinTransactionModal from '@/components/fin/FinTransactionModal'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed:  { label: 'Confirmado', color: 'text-green-400 bg-green-950 border border-green-800' },
  pending:    { label: 'Pendente',   color: 'text-yellow-400 bg-yellow-950 border border-yellow-800' },
  scheduled:  { label: 'Agendado',  color: 'text-blue-400 bg-blue-950 border border-blue-800' },
  reconciled: { label: 'Conciliado',color: 'text-purple-400 bg-purple-950 border border-purple-800' },
}

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]

function exportCSV(lista: any[]) {
  const header = 'Data,Tipo,Descrição,Categoria,Conta,Valor,Status'
  const rows = lista.map(t => {
    const dt   = new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')
    const tipo = t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência'
    const cat  = (t.category?.name ?? '').replace(/,/g,' ')
    const acc  = (t.account?.name  ?? '').replace(/,/g,' ')
    const desc = (t.description    ?? '').replace(/,/g,' ')
    const val  = Number(t.amount).toFixed(2)
    const st   = STATUS_CONFIG[t.status]?.label ?? t.status
    return `${dt},${tipo},"${desc}","${cat}","${acc}",${val},${st}`
  })
  const csv  = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'lancamentos-empresarial.csv'
  a.click(); URL.revokeObjectURL(url)
}

export default function LancamentosPage() {
  const [txs,          setTxs]          = useState<any[]>([])
  const [accounts,     setAccounts]     = useState<any[]>([])
  const [categories,   setCategories]   = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(false)
  const [editing,      setEditing]      = useState<any>(null)
  const [busca,        setBusca]        = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [start,        setStart]        = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`)
  const [end,          setEnd]          = useState(fmt(today))
  const [listening,    setListening]    = useState(false)
  const [voiceText,    setVoiceText]    = useState('')
  const recogRef = useRef<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams({ start, end })
    if (filterType)   qs.set('type', filterType)
    if (filterStatus) qs.set('status', filterStatus)
    const [t, acc, cat] = await Promise.all([
      fetch(`/api/fin/transactions?${qs}`).then(r => r.json()),
      fetch('/api/fin/accounts').then(r => r.json()),
      fetch('/api/fin/categories').then(r => r.json()),
    ])
    setTxs(Array.isArray(t) ? t : [])
    setAccounts(Array.isArray(acc) ? acc : [])
    setCategories(Array.isArray(cat) ? cat : [])
    setLoading(false)
  }, [start, end, filterType, filterStatus])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return
    await fetch('/api/fin/transactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const handleConfirm = async (tx: any) => {
    await fetch('/api/fin/transactions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tx.id, status: 'confirmed' }) })
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
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      setEditing({ voice_input: text, status: 'confirmed' })
      setModal(true)
    }
    rec.start()
  }

  const filtered = txs.filter(t =>
    !busca || t.description?.toLowerCase().includes(busca.toLowerCase()) ||
    t.category?.name?.toLowerCase().includes(busca.toLowerCase())
  )

  const totalReceitas = filtered.filter(t => t.type === 'income'  && ['confirmed','reconciled'].includes(t.status)).reduce((a,t) => a + Number(t.amount), 0)
  const totalDespesas = filtered.filter(t => t.type === 'expense' && ['confirmed','reconciled'].includes(t.status)).reduce((a,t) => a + Number(t.amount), 0)
  const resultado     = totalReceitas - totalDespesas

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-white">Lançamentos</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">{filtered.length} registro(s) no período</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={listening ? () => recogRef.current?.stop() : startVoice}
            className={`flex items-center justify-center w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
              listening ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}>
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <Download size={14} />
          </button>
          <button onClick={() => { setEditing(null); setModal(true) }}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
            <Plus size={14} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {voiceText && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300 flex items-center justify-between">
          <span className="truncate">🎤 "{voiceText}"</span>
          <button onClick={() => setVoiceText('')} className="ml-2 flex-shrink-0"><X size={12} /></button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-gray-900 rounded-xl p-3 md:p-4 border border-gray-800 mb-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors">
            <option value="">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="transfer">Transferências</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors">
            <option value="">Todos os status</option>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendente</option>
            <option value="scheduled">Agendado</option>
          </select>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Buscar por descrição ou categoria..." value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border-l-4 border-green-500 bg-green-950 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">Receitas confirmadas</p>
          <p className="text-sm md:text-lg font-bold text-white tabular-nums truncate">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">Despesas confirmadas</p>
          <p className="text-sm md:text-lg font-bold text-white tabular-nums truncate">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-3 md:p-4 ${resultado >= 0 ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">Resultado</p>
          <p className={`text-sm md:text-lg font-bold tabular-nums truncate ${resultado >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(resultado)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div>{[...Array(8)].map((_,i) => <div key={i} className="h-12 bg-gray-800 animate-pulse border-b border-gray-700" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">Nenhum lançamento encontrado.</p>
            <button onClick={() => { setEditing(null); setModal(true) }}
              className="mt-4 text-blue-400 text-sm font-semibold hover:underline">
              + Criar primeiro lançamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800 bg-gray-800/50">
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide whitespace-nowrap">Data</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide">Descrição</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide whitespace-nowrap">Categoria</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide whitespace-nowrap">Conta</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-right whitespace-nowrap">Valor</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => {
                  const st = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending
                  return (
                    <tr key={tx.id ?? i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-lg flex-shrink-0 ${
                            tx.type === 'income' ? 'bg-green-950' : tx.type === 'expense' ? 'bg-red-950' : 'bg-blue-950'
                          }`}>
                            {tx.type === 'income'
                              ? <TrendingUp size={11} className="text-green-400" />
                              : tx.type === 'expense'
                              ? <TrendingDown size={11} className="text-red-400" />
                              : <ArrowLeftRight size={11} className="text-blue-400" />}
                          </div>
                          <span className="text-gray-200 text-xs font-medium truncate">{tx.description || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{tx.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {tx.type === 'transfer'
                          ? `${tx.account?.name} → ${tx.to_account?.name}`
                          : tx.account?.name ?? '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-xs tabular-nums whitespace-nowrap ${
                        tx.type === 'income' ? 'text-green-400' : tx.type === 'expense' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {tx.type === 'expense' ? '− ' : ''}{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          {['pending','scheduled'].includes(tx.status) && (
                            <button onClick={() => handleConfirm(tx)} title="Confirmar"
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-950 transition-colors">
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
          </div>
        )}
      </div>

      <FinTransactionModal
        open={modal}
        onClose={() => { setModal(false); setEditing(null); setVoiceText('') }}
        onSaved={load}
        accounts={accounts}
        categories={categories}
        initial={editing}
      />
    </div>
  )
}
