'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Check, Clock, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import TransactionModal from '@/components/fin/TransactionModal'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed:  { label: 'Confirmado', color: 'text-green-400 bg-green-950 border border-green-800' },
  pending:    { label: 'Pendente',   color: 'text-yellow-400 bg-yellow-950 border border-yellow-800' },
  scheduled:  { label: 'Agendado',  color: 'text-blue-400 bg-blue-950 border border-blue-800' },
  reconciled: { label: 'Conciliado',color: 'text-purple-400 bg-purple-950 border border-purple-800' },
}

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]

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

  const filtered = txs.filter(t =>
    !busca || t.description?.toLowerCase().includes(busca.toLowerCase()) ||
    t.category?.name?.toLowerCase().includes(busca.toLowerCase())
  )

  const totalReceitas = filtered.filter(t => t.type === 'income'  && ['confirmed','reconciled'].includes(t.status)).reduce((a,t) => a + Number(t.amount), 0)
  const totalDespesas = filtered.filter(t => t.type === 'expense' && ['confirmed','reconciled'].includes(t.status)).reduce((a,t) => a + Number(t.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Lançamentos</h2>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} registros no período</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
            <option value="">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="transfer">Transferências</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
            <option value="">Todos os status</option>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendente</option>
            <option value="scheduled">Agendado</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border-l-4 border-green-500 bg-green-950 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Receitas confirmadas</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Despesas confirmadas</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-4 ${totalReceitas-totalDespesas >= 0 ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resultado</p>
          <p className={`text-xl font-bold ${totalReceitas-totalDespesas >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(totalReceitas - totalDespesas)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div>{[...Array(8)].map((_,i) => <div key={i} className="h-14 bg-gray-800 animate-pulse border-b border-gray-700" />)}</div>
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
                {filtered.map((tx, i) => {
                  const st = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending
                  return (
                    <tr key={tx.id ?? i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            tx.type === 'income' ? 'bg-green-950' : tx.type === 'expense' ? 'bg-red-950' : 'bg-blue-950'
                          }`}>
                            {tx.type === 'income'
                              ? <TrendingUp size={12} className="text-green-400" />
                              : tx.type === 'expense'
                              ? <TrendingDown size={12} className="text-red-400" />
                              : <ArrowLeftRight size={12} className="text-blue-400" />}
                          </div>
                          <span className="text-gray-200 font-medium">{tx.description || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{tx.category?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {tx.type === 'transfer'
                          ? `${tx.account?.name} → ${tx.to_account?.name}`
                          : tx.account?.name ?? '—'}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold ${
                        tx.type === 'income' ? 'text-green-400' : tx.type === 'expense' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {tx.type === 'expense' ? '- ' : ''}{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {['pending','scheduled'].includes(tx.status) && (
                            <button onClick={() => handleConfirm(tx)} title="Confirmar"
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-950 transition-colors">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => { setEditing(tx); setModal(true) }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-700 hover:text-gray-200 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(tx.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-950 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
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

      <TransactionModal
        open={modal}
        onClose={() => { setModal(false); setEditing(null) }}
        onSaved={load}
        accounts={accounts}
        categories={categories}
        initial={editing}
      />
    </div>
  )
}
