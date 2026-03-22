'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight, Mic, MicOff, Check, Filter, X, Download } from 'lucide-react'
import PfTransactionModal from '@/components/pf/PfTransactionModal'

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  confirmed: { label: 'Confirmado', class: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
  pending:   { label: 'Pendente',   class: 'bg-yellow-950 text-yellow-400 border-yellow-800'   },
  scheduled: { label: 'Agendado',   class: 'bg-blue-950 text-blue-400 border-blue-800'         },
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function exportCSV(lista: any[], mes: number, ano: number) {
  const header = 'Data,Tipo,Descrição,Categoria,Conta,Valor,Status'
  const rows   = lista.map(t => {
    const dt   = new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')
    const tipo = t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Gasto' : 'Transferência'
    const cat  = (t.category?.name ?? '').replace(/,/g,' ')
    const acc  = (t.account?.name  ?? '').replace(/,/g,' ')
    const desc = (t.description    ?? '').replace(/,/g,' ')
    const val  = Number(t.amount).toFixed(2)
    const st   = STATUS_LABEL[t.status]?.label ?? t.status
    return `${dt},${tipo},"${desc}","${cat}","${acc}",${val},${st}`
  })
  const csv  = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `lancamentos-${mes}-${ano}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function PfLancamentosPage() {
  const [txs,       setTxs]       = useState<any[]>([])
  const [accounts,  setAccounts]  = useState<any[]>([])
  const [cats,      setCats]      = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState<any>(null)
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const recogRef = useRef<any>(null)

  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  // Filtros
  const [tipo,      setTipo]      = useState<'todos'|'income'|'expense'>('todos')
  const [statusFil, setStatusFil] = useState<string>('todos')
  const [contaFil,  setContaFil]  = useState<string>('')
  const [catFil,    setCatFil]    = useState<string>('')
  const [busca,     setBusca]     = useState('')

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
    if (!confirm('Excluir?')) return
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
      setEditing({ voice_input: text, status: 'confirmed', recurrence: 'single' })
      setModal(true)
    }
    rec.start()
  }

  const hasFilters = tipo !== 'todos' || statusFil !== 'todos' || contaFil || catFil || busca
  const clearFilters = () => { setTipo('todos'); setStatusFil('todos'); setContaFil(''); setCatFil(''); setBusca('') }

  const lista = txs
    .filter(t => tipo === 'todos'    || t.type      === tipo)
    .filter(t => statusFil === 'todos' || t.status  === statusFil)
    .filter(t => !contaFil           || t.account_id === contaFil)
    .filter(t => !catFil             || t.category_id === catFil)
    .filter(t => !busca              || (t.description ?? '').toLowerCase().includes(busca.toLowerCase()))

  const totalReceitas = txs.filter(t => t.type === 'income'  && t.status === 'confirmed').reduce((a, t) => a + Number(t.amount), 0)
  const totalGastos   = txs.filter(t => t.type === 'expense' && t.status === 'confirmed').reduce((a, t) => a + Number(t.amount), 0)
  const resultado     = totalReceitas - totalGastos

  const catsFiltro = cats.filter(c => c.type === (tipo === 'income' ? 'income' : 'expense') || tipo === 'todos')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Lançamentos</h2>
          <p className="text-gray-400 text-xs mt-0.5">{MONTHS[mes-1]}/{ano} · {txs.length} lançamento(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              showFilters || hasFilters ? 'bg-emerald-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}>
            <Filter size={13} /> {hasFilters ? 'Filtros ativos' : 'Filtros'}
          </button>
          <button onClick={listening ? () => recogRef.current?.stop() : startVoice}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              listening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}>
            {listening ? <MicOff size={13} /> : <Mic size={13} />}
          </button>
          <button onClick={() => { setEditing(null); setModal(true) }}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {voiceText && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-3 py-2 mb-3 text-xs text-emerald-300 flex items-center justify-between">
          <span>🎤 "{voiceText}"</span>
          <button onClick={() => setVoiceText('')}><X size={12} /></button>
        </div>
      )}

      {/* KPIs compactos */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-950 p-3">
          <p className="text-[10px] text-gray-400 uppercase mb-0.5">Receitas</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-3">
          <p className="text-[10px] text-gray-400 uppercase mb-0.5">Gastos</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalGastos)}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-3 ${resultado >= 0 ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-[10px] text-gray-400 uppercase mb-0.5">Resultado</p>
          <p className={`text-sm font-bold ${resultado >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(resultado)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-2 mb-4">
        {/* Linha 1: tipo + mês */}
        <div className="flex gap-1.5">
          {([['todos','Todos'],['income','Receitas'],['expense','Gastos']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTipo(k)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                tipo === k ? 'bg-emerald-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400'
              }`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => { const d = new Date(ano, mes-2, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
            className="px-3 py-2 rounded-xl text-xs bg-gray-800 border border-gray-700 text-gray-400">‹</button>
          <span className="flex-1 text-center py-2 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl">{MONTHS[mes-1]}/{ano}</span>
          <button onClick={() => { const d = new Date(ano, mes, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
            className="px-3 py-2 rounded-xl text-xs bg-gray-800 border border-gray-700 text-gray-400">›</button>
        </div>

        {/* Busca */}
        <input type="text" placeholder="🔍 Buscar por descrição..." value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />

        {/* Filtros avançados */}
        {showFilters && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filtros avançados</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  <X size={11} /> Limpar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Situação</label>
                <select value={statusFil} onChange={e => setStatusFil(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="todos">Todas</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="pending">Pendentes</option>
                  <option value="scheduled">Agendados</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Conta</label>
                <select value={contaFil} onChange={e => setContaFil(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="">Todas</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Categoria</label>
                <select value={catFil} onChange={e => setCatFil(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="">Todas</option>
                  {catsFiltro.filter(c => !c.parent_id).map(c => (
                    <optgroup key={c.id} label={`${c.icon ?? ''} ${c.name}`}>
                      <option value={c.id}>{c.name}</option>
                      {cats.filter(s => s.parent_id === c.id).map(s => <option key={s.id} value={s.id}>— {s.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de resultado + export */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{lista.length} lançamento(s) {hasFilters ? 'filtrado(s)' : ''}</p>
        <button onClick={() => exportCSV(lista, mes, ano)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
          <Download size={12} /> CSV
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : lista.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 py-12 text-center">
          <p className="text-gray-500 text-sm">Nenhum lançamento encontrado.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-2 text-xs text-emerald-400 hover:underline">Limpar filtros</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((tx, i) => {
            const st = STATUS_LABEL[tx.status] ?? STATUS_LABEL.confirmed
            const isIncome   = tx.type === 'income'
            const isTransfer = tx.type === 'transfer'
            return (
              <div key={tx.id ?? i} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isIncome ? 'bg-emerald-950' : isTransfer ? 'bg-blue-950' : 'bg-red-950'
                }`}>
                  {isIncome ? <TrendingUp size={16} className="text-emerald-400" /> :
                   isTransfer ? <ArrowLeftRight size={16} className="text-blue-400" /> :
                   <TrendingDown size={16} className="text-red-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-200 truncate">{tx.description || '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {tx.category && (
                      <span className="text-[10px] text-gray-500">{tx.category.icon} {tx.category.name}</span>
                    )}
                    {tx.account && (
                      <span className="text-[10px] text-gray-600">· {tx.account.name}</span>
                    )}
                    <span className="text-[10px] text-gray-600">
                      {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                    {tx.status !== 'confirmed' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${st.class}`}>{st.label}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <p className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : isTransfer ? 'text-blue-400' : 'text-red-400'}`}>
                    {isIncome ? '+' : '−'}{formatCurrency(Number(tx.amount))}
                  </p>
                  <div className="flex gap-1">
                    {tx.status !== 'confirmed' && (
                      <button onClick={() => handleConfirm(tx)} className="p-1 rounded text-gray-500 hover:text-emerald-400"><Check size={12} /></button>
                    )}
                    <button onClick={() => { setEditing(tx); setModal(true) }} className="p-1 rounded text-gray-500 hover:text-gray-300"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(tx.id)} className="p-1 rounded text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PfTransactionModal
        open={modal}
        onClose={() => { setModal(false); setEditing(null); setVoiceText('') }}
        onSaved={load}
        accounts={accounts}
        categories={cats}
        initial={editing}
      />
    </div>
  )
}
