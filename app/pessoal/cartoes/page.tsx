'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Plus, Pencil, Trash2, TrendingDown, AlertTriangle } from 'lucide-react'

// Calcula início e fim do ciclo de faturamento
function billingCycle(closingDay: number, offset = 0): { start: string; end: string; dueLabel: string } {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() // 0-indexed

  // Mês de referência (0 = atual, -1 = anterior)
  const refDate  = new Date(year, month + offset, 1)
  const refYear  = refDate.getFullYear()
  const refMonth = refDate.getMonth()

  const endDate   = new Date(refYear, refMonth, closingDay)
  const startDate = new Date(refYear, refMonth - 1, closingDay + 1)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const due = new Date(refYear, refMonth + 1, 15) // due_day fixo 15 para simplificar
  return {
    start:    fmt(startDate),
    end:      fmt(endDate),
    dueLabel: due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  }
}

export default function CartoesPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [txs,      setTxs]      = useState<Record<string, any[]>>({})
  const [loading,  setLoading]  = useState(true)
  const [cycle,    setCycle]    = useState(0) // 0 = fatura atual, -1 = anterior
  const [editCard, setEditCard] = useState<any>(null)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const acc = await fetch('/api/pf/accounts').then(r => r.json())
    const cards = Array.isArray(acc) ? acc.filter((a: any) => a.type === 'credit_card') : []
    setAccounts(cards)

    const txMap: Record<string, any[]> = {}
    await Promise.all(cards.map(async (card: any) => {
      const closing = card.closing_day ?? 5
      const { start, end } = billingCycle(closing, cycle)
      const data = await fetch(`/api/pf/transactions?account_id_eq=${card.id}&start=${start}&end=${end}&type=expense`)
        .then(r => r.json())
      txMap[card.id] = Array.isArray(data) ? data : []
    }))
    setTxs(txMap)
    setLoading(false)
  }, [cycle])

  useEffect(() => { load() }, [load])

  const handleSaveCard = async () => {
    if (!editCard) return
    setSaving(true)
    await fetch('/api/pf/accounts', {
      method: editCard.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editCard, type: 'credit_card' }),
    })
    setSaving(false); setEditCard(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover cartão?')) return
    await fetch('/api/pf/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Cartões de Crédito</h2>
          <p className="text-gray-400 text-sm mt-1">Faturas e limites</p>
        </div>
        <div className="flex gap-2">
          {/* Seletor de fatura */}
          <div className="flex gap-1">
            <button onClick={() => setCycle(c => c - 1)}
              className="px-3 py-2 rounded-xl text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">‹</button>
            <span className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl">
              {cycle === 0 ? 'Fatura Atual' : cycle === -1 ? 'Fatura Anterior' : `${Math.abs(cycle)} fat. atrás`}
            </span>
            <button onClick={() => setCycle(c => Math.min(0, c + 1))}
              className="px-3 py-2 rounded-xl text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">›</button>
          </div>
          <button onClick={() => setEditCard({ name: '', credit_limit: 0, closing_day: 5, due_day: 15, color: '#8b5cf6' })}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
            <Plus size={15} /> Novo Cartão
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_,i) => <div key={i} className="h-48 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 py-16 text-center">
          <CreditCard size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Nenhum cartão cadastrado.</p>
          <button onClick={() => setEditCard({ name: '', credit_limit: 0, closing_day: 5, due_day: 15, color: '#8b5cf6' })}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
            Adicionar cartão
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {accounts.map(card => {
            const closing = card.closing_day ?? 5
            const { start, end, dueLabel } = billingCycle(closing, cycle)
            const cardTxs  = txs[card.id] ?? []
            const fatTotal = cardTxs.reduce((a, t) => a + Number(t.amount), 0)
            const limit    = Number(card.credit_limit ?? 0)
            const usado    = fatTotal
            const disp     = limit > 0 ? limit - usado : null
            const pct      = limit > 0 ? Math.min(100, Math.round((usado / limit) * 100)) : 0
            const over     = limit > 0 && usado > limit

            return (
              <div key={card.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                {/* Header do cartão */}
                <div className="p-5 border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: card.color ?? '#8b5cf6' }}>
                        <CreditCard size={22} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{card.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Fecha dia {closing} · Vence {dueLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditCard(card)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(card.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Limite + barra */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">Fatura: <span className="text-red-400 font-bold">{formatCurrency(fatTotal)}</span></span>
                      {limit > 0 && (
                        <span className="text-xs text-gray-500">
                          {over ? <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={10} /> Limite excedido</span>
                            : <>Disponível: <span className="text-emerald-400 font-semibold">{formatCurrency(disp ?? 0)}</span></>}
                        </span>
                      )}
                    </div>
                    {limit > 0 && (
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{
                          width: `${pct}%`,
                          background: over ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981'
                        }} />
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>{new Date(start + 'T12:00:00').toLocaleDateString('pt-BR')} → {new Date(end + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      {limit > 0 && <span>Limite: {formatCurrency(limit)}</span>}
                    </div>
                  </div>
                </div>

                {/* Lançamentos da fatura */}
                {cardTxs.length === 0 ? (
                  <div className="p-6 text-center text-gray-600 text-sm">Sem lançamentos nesta fatura.</div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {cardTxs.slice(0, 8).map((tx, i) => (
                      <div key={tx.id ?? i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-red-950 flex items-center justify-center flex-shrink-0">
                          <TrendingDown size={14} className="text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 font-medium truncate">{tx.description || tx.category?.name || '—'}</p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            {tx.category && ` · ${tx.category.icon ?? ''} ${tx.category.name}`}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-red-400 flex-shrink-0">{formatCurrency(Number(tx.amount))}</p>
                      </div>
                    ))}
                    {cardTxs.length > 8 && (
                      <div className="px-5 py-2.5 text-center text-xs text-gray-500">
                        +{cardTxs.length - 8} lançamentos • Total: {formatCurrency(fatTotal)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal cartão */}
      {editCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">{editCard.id ? 'Editar Cartão' : 'Novo Cartão'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nome do cartão</label>
                <input type="text" placeholder="Ex: Nubank, Itaú Visa..."
                  value={editCard.name ?? ''}
                  onChange={e => setEditCard({...editCard, name: e.target.value})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Limite (R$)</label>
                <input type="number" step="0.01" placeholder="0,00"
                  value={editCard.credit_limit ?? ''}
                  onChange={e => setEditCard({...editCard, credit_limit: parseFloat(e.target.value)})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha dia</label>
                  <input type="number" min={1} max={31}
                    value={editCard.closing_day ?? 5}
                    onChange={e => setEditCard({...editCard, closing_day: parseInt(e.target.value)})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vence dia</label>
                  <input type="number" min={1} max={31}
                    value={editCard.due_day ?? 15}
                    onChange={e => setEditCard({...editCard, due_day: parseInt(e.target.value)})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cor</label>
                <input type="color"
                  value={editCard.color ?? '#8b5cf6'}
                  onChange={e => setEditCard({...editCard, color: e.target.value})}
                  className="mt-1 w-full h-10 bg-gray-800 border border-gray-700 rounded-xl cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditCard(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveCard} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
