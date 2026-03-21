'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Check, Clock, Pencil, Trash2, ArrowUpCircle } from 'lucide-react'
import TransactionModal from '@/components/fin/TransactionModal'

const today = () => new Date().toISOString().split('T')[0]

export default function ContasReceberPage() {
  const [txs,        setTxs]        = useState<any[]>([])
  const [accounts,   setAccounts]   = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState<any>(null)
  const [aba,        setAba]        = useState<'pendentes'|'atrasadas'|'todas'>('pendentes')

  const load = useCallback(async () => {
    setLoading(true)
    const [t, acc, cat] = await Promise.all([
      fetch('/api/fin/transactions?type=income').then(r => r.json()),
      fetch('/api/fin/accounts').then(r => r.json()),
      fetch('/api/fin/categories').then(r => r.json()),
    ])
    const all = Array.isArray(t) ? t : []
    setTxs(all.filter(tx => tx.status === 'pending' || tx.status === 'scheduled'))
    setAccounts(Array.isArray(acc) ? acc : [])
    setCategories(Array.isArray(cat) ? cat : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (tx: any) => {
    await fetch('/api/fin/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tx.id, status: 'confirmed' }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return
    await fetch('/api/fin/transactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const todayStr = today()
  const atrasadas = txs.filter(t => t.date < todayStr)
  const pendentes = txs.filter(t => t.date >= todayStr)
  const lista = aba === 'atrasadas' ? atrasadas : aba === 'pendentes' ? pendentes : txs

  const totalLista     = lista.reduce((a, t) => a + Number(t.amount), 0)
  const totalAtrasado  = atrasadas.reduce((a, t) => a + Number(t.amount), 0)
  const totalPendente  = pendentes.reduce((a, t) => a + Number(t.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contas a Receber</h2>
          <p className="text-gray-400 text-sm mt-1">{txs.length} recebimento(s) em aberto</p>
        </div>
        <button onClick={() => { setEditing({ type: 'income', status: 'pending' }); setModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus size={16} /> Novo a Receber
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={15} className="text-orange-500" />
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Em atraso</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalAtrasado)}</p>
          <p className="text-xs text-orange-400 mt-1">{atrasadas.length} recebimento(s)</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle size={15} className="text-blue-500" />
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">A receber</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPendente)}</p>
          <p className="text-xs text-blue-400 mt-1">{pendentes.length} recebimento(s)</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Total esperado</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalAtrasado + totalPendente)}</p>
          <p className="text-xs text-green-500 mt-1">{txs.length} recebimento(s)</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        {([['pendentes','A receber'],['atrasadas','Em atraso'],['todas','Todas']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setAba(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              aba === k ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'
            }`}>{l}</button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div>{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-gray-50 animate-pulse border-b border-gray-100" />)}</div>
        ) : lista.length === 0 ? (
          <div className="py-16 text-center">
            <Check size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum recebimento pendente!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 font-semibold">Vencimento</th>
                <th className="px-5 py-3 font-semibold">Descrição</th>
                <th className="px-5 py-3 font-semibold">Categoria</th>
                <th className="px-5 py-3 font-semibold">Conta</th>
                <th className="px-5 py-3 font-semibold text-right">Valor</th>
                <th className="px-5 py-3 font-semibold">Situação</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((tx, i) => {
                const atrasada = tx.date < todayStr
                const dias = Math.abs(Math.floor((new Date().getTime() - new Date(tx.date + 'T12:00:00').getTime()) / 86400000))
                return (
                  <tr key={tx.id ?? i} className={`border-b border-gray-50 hover:bg-blue-50/20 transition-colors ${atrasada ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-700 whitespace-nowrap">
                      {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{tx.description || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{tx.category?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{tx.account?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-green-600">{formatCurrency(Number(tx.amount))}</td>
                    <td className="px-5 py-3.5">
                      {atrasada ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          <Clock size={10} /> {dias}d em atraso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                          <Clock size={10} /> em {dias}d
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleConfirm(tx)} title="Confirmar recebimento"
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={() => { setEditing(tx); setModal(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-5 py-3 font-bold text-gray-700">Total</td>
                <td className="px-5 py-3 text-right font-bold text-green-600">{formatCurrency(totalLista)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
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
