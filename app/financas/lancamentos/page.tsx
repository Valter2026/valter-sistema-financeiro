'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Check, Clock, AlertCircle, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import TransactionModal from '@/components/fin/TransactionModal'

const STATUS_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  confirmed:  { label: 'Confirmado', color: 'text-green-600 bg-green-50',  icon: Check },
  pending:    { label: 'Pendente',   color: 'text-orange-600 bg-orange-50', icon: Clock },
  scheduled:  { label: 'Agendado',  color: 'text-blue-600 bg-blue-50',    icon: Clock },
  reconciled: { label: 'Conciliado',color: 'text-purple-600 bg-purple-50', icon: Check },
}

const TYPE_ICON: Record<string, any> = {
  income:   TrendingUp,
  expense:  TrendingDown,
  transfer: ArrowLeftRight,
}

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]

export default function LancamentosPage() {
  const [txs,        setTxs]        = useState<any[]>([])
  const [accounts,   setAccounts]   = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState<any>(null)
  const [busca,      setBusca]      = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [start,      setStart]      = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`)
  const [end,        setEnd]        = useState(fmt(today))

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
    await fetch('/api/fin/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tx.id, status: 'confirmed' }),
    })
    load()
  }

  const filtered = txs.filter(t =>
    !busca || t.description?.toLowerCase().includes(busca.toLowerCase()) ||
    t.category?.name?.toLowerCase().includes(busca.toLowerCase())
  )

  const totalReceitas = filtered.filter(t => t.type === 'income' && (t.status === 'confirmed' || t.status === 'reconciled')).reduce((a,t) => a + Number(t.amount), 0)
  const totalDespesas = filtered.filter(t => t.type === 'expense' && (t.status === 'confirmed' || t.status === 'reconciled')).reduce((a,t) => a + Number(t.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lançamentos</h2>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} registros no período</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="transfer">Transferências</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Todos os status</option>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendente</option>
            <option value="scheduled">Agendado</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        </div>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Receitas confirmadas</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Despesas confirmadas</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${totalReceitas-totalDespesas >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Resultado</p>
          <p className={`text-xl font-bold mt-1 ${totalReceitas-totalDespesas >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {formatCurrency(totalReceitas - totalDespesas)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0">{[...Array(8)].map((_,i) => (
            <div key={i} className="h-14 bg-gray-50 animate-pulse border-b border-gray-100" />
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum lançamento encontrado.</p>
            <button onClick={() => { setEditing(null); setModal(true) }}
              className="mt-4 text-blue-600 text-sm font-semibold hover:underline">
              + Criar primeiro lançamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Descrição</th>
                  <th className="px-5 py-3 font-semibold">Categoria</th>
                  <th className="px-5 py-3 font-semibold">Conta</th>
                  <th className="px-5 py-3 font-semibold text-right">Valor</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => {
                  const Icon = TYPE_ICON[tx.type] ?? ArrowLeftRight
                  const st   = STATUS_LABEL[tx.status] ?? STATUS_LABEL.pending
                  const StIcon = st.icon
                  return (
                    <tr key={tx.id ?? i} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            tx.type === 'income' ? 'bg-green-50' : tx.type === 'expense' ? 'bg-red-50' : 'bg-blue-50'
                          }`}>
                            <Icon size={13} className={
                              tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-500' : 'text-blue-600'
                            } />
                          </div>
                          <span className="text-gray-800 font-medium">
                            {tx.description || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{tx.category?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {tx.type === 'transfer'
                          ? `${tx.account?.name} → ${tx.to_account?.name}`
                          : tx.account?.name ?? '—'}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold ${
                        tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-500' : 'text-blue-600'
                      }`}>
                        {tx.type === 'expense' ? '- ' : ''}{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          <StIcon size={10} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {(tx.status === 'pending' || tx.status === 'scheduled') && (
                            <button onClick={() => handleConfirm(tx)} title="Confirmar"
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => { setEditing(tx); setModal(true) }} title="Editar"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(tx.id)} title="Excluir"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
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
