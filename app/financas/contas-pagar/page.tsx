'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Check, AlertTriangle, Clock, Pencil, Trash2 } from 'lucide-react'
import TransactionModal from '@/components/fin/TransactionModal'

const today = () => new Date().toISOString().split('T')[0]

export default function ContasPagarPage() {
  const [txs,        setTxs]        = useState<any[]>([])
  const [accounts,   setAccounts]   = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState<any>(null)
  const [aba,        setAba]        = useState<'pendentes'|'vencidas'|'todas'>('pendentes')

  const load = useCallback(async () => {
    setLoading(true)
    const [t, acc, cat] = await Promise.all([
      fetch('/api/fin/transactions?type=expense').then(r => r.json()),
      fetch('/api/fin/accounts').then(r => r.json()),
      fetch('/api/fin/categories').then(r => r.json()),
    ])
    const all = Array.isArray(t) ? t : []
    setTxs(all.filter(tx => ['pending','scheduled'].includes(tx.status)))
    setAccounts(Array.isArray(acc) ? acc : [])
    setCategories(Array.isArray(cat) ? cat : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (tx: any) => {
    await fetch('/api/fin/transactions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tx.id, status: 'confirmed' }) })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return
    await fetch('/api/fin/transactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const todayStr   = today()
  const vencidas   = txs.filter(t => t.date < todayStr)
  const pendentes  = txs.filter(t => t.date >= todayStr)
  const lista      = aba === 'vencidas' ? vencidas : aba === 'pendentes' ? pendentes : txs
  const totalLista   = lista.reduce((a, t) => a + Number(t.amount), 0)
  const totalVencido = vencidas.reduce((a, t) => a + Number(t.amount), 0)
  const totalPendente= pendentes.reduce((a, t) => a + Number(t.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Contas a Pagar</h2>
          <p className="text-gray-400 text-sm mt-1">{txs.length} conta(s) em aberto</p>
        </div>
        <button onClick={() => { setEditing({ type: 'expense', status: 'pending' }); setModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Nova Conta a Pagar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-red-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">Vencidas</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalVencido)}</p>
          <p className="text-xs text-red-400 mt-1">{vencidas.length} conta(s)</p>
        </div>
        <div className="rounded-xl border-l-4 border-yellow-500 bg-yellow-950 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-yellow-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">A vencer</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalPendente)}</p>
          <p className="text-xs text-yellow-400 mt-1">{pendentes.length} conta(s)</p>
        </div>
        <div className="rounded-xl border-l-4 border-gray-600 bg-gray-900 p-5 border border-gray-800">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total em aberto</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalVencido + totalPendente)}</p>
          <p className="text-xs text-gray-500 mt-1">{txs.length} conta(s)</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        {([['pendentes','A vencer'],['vencidas','Vencidas'],['todas','Todas']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setAba(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              aba === k ? 'bg-blue-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}>{l}</button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div>{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-gray-800 animate-pulse border-b border-gray-700" />)}</div>
        ) : lista.length === 0 ? (
          <div className="py-16 text-center">
            <Check size={32} className="text-green-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma conta {aba === 'vencidas' ? 'vencida' : 'a pagar'}!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800 bg-gray-800/50">
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Vencimento</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Descrição</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Categoria</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Conta</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Valor</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wide">Situação</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((tx, i) => {
                const vencida = tx.date < todayStr
                const dias = Math.abs(Math.floor((new Date().getTime() - new Date(tx.date + 'T12:00:00').getTime()) / 86400000))
                return (
                  <tr key={tx.id ?? i} className={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${vencida ? 'bg-red-950/20' : ''}`}>
                    <td className="px-5 py-3.5 text-gray-300 whitespace-nowrap font-medium">
                      {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-200 font-medium">{tx.description || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{tx.category?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{tx.account?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-red-400">{formatCurrency(Number(tx.amount))}</td>
                    <td className="px-5 py-3.5">
                      {vencida ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-800">
                          <AlertTriangle size={10} /> {dias}d em atraso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-950 text-yellow-400 border border-yellow-800">
                          <Clock size={10} /> vence em {dias}d
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleConfirm(tx)} title="Marcar como pago"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-green-950 hover:text-green-400 transition-colors">
                          <Check size={14} />
                        </button>
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
            <tfoot>
              <tr className="border-t-2 border-gray-700 bg-gray-800/50">
                <td colSpan={4} className="px-5 py-3 font-bold text-gray-300">Total</td>
                <td className="px-5 py-3 text-right font-bold text-red-400">{formatCurrency(totalLista)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <TransactionModal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSaved={load} accounts={accounts} categories={categories} initial={editing} />
    </div>
  )
}
