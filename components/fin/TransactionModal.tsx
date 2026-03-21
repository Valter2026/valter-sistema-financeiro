'use client'
import { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type TxType = 'income' | 'expense' | 'transfer'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  accounts: any[]
  categories: any[]
  initial?: Partial<any>
}

const today = () => new Date().toISOString().split('T')[0]

export default function TransactionModal({ open, onClose, onSaved, accounts, categories, initial }: Props) {
  const [type,       setType]       = useState<TxType>('expense')
  const [amount,     setAmount]     = useState('')
  const [date,       setDate]       = useState(today())
  const [description,setDescription]= useState('')
  const [accountId,  setAccountId]  = useState('')
  const [toAccountId,setToAccountId]= useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status,     setStatus]     = useState('confirmed')
  const [recType,    setRecType]    = useState('single')
  const [installments,setInstallments]=useState(2)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (open) {
      setType(initial?.type ?? 'expense')
      setAmount(initial?.amount ? String(initial.amount) : '')
      setDate(initial?.date ?? today())
      setDescription(initial?.description ?? '')
      setAccountId(initial?.account_id ?? accounts[0]?.id ?? '')
      setToAccountId(initial?.to_account_id ?? '')
      setCategoryId(initial?.category_id ?? '')
      setStatus(initial?.status ?? 'confirmed')
      setRecType(initial?.recurrence_type ?? 'single')
      setInstallments(initial?.total_installments ?? 2)
      setError('')
    }
  }, [open, initial, accounts])

  const catsFiltradas = categories.filter(c =>
    type === 'transfer' ? false : c.type === type && !c.parent_id
  )
  const subCats = categories.filter(c => c.parent_id === categoryId)

  const handleSave = async () => {
    if (!amount || !accountId) { setError('Preencha valor e conta.'); return }
    if (type !== 'transfer' && !categoryId) { setError('Selecione uma categoria.'); return }
    if (type === 'transfer' && !toAccountId) { setError('Selecione a conta de destino.'); return }
    setSaving(true); setError('')
    try {
      const payload: any = {
        type,
        amount: parseFloat(amount.replace(',', '.')),
        date,
        description,
        account_id: accountId,
        status,
        recurrence_type: recType,
      }
      if (type !== 'transfer') payload.category_id = categoryId
      if (type === 'transfer') payload.to_account_id = toAccountId
      if (recType === 'installment') payload.total_installments = installments
      if (initial?.id) payload.id = initial.id

      const method = initial?.id ? 'PUT' : 'POST'
      const res = await fetch('/api/fin/transactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSaved(); onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const typeConfig = {
    income:   { label: 'Receita',      icon: TrendingUp,      color: 'bg-green-500', ring: 'ring-green-400' },
    expense:  { label: 'Despesa',      icon: TrendingDown,    color: 'bg-red-500',   ring: 'ring-red-400'   },
    transfer: { label: 'Transferência',icon: ArrowLeftRight,   color: 'bg-blue-500',  ring: 'ring-blue-400'  },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className={`${typeConfig[type].color} rounded-t-2xl px-6 py-4 flex items-center justify-between`}>
          <h2 className="text-white font-bold text-lg">
            {initial?.id ? 'Editar' : 'Novo'} Lançamento
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-3 gap-2">
            {(['income','expense','transfer'] as TxType[]).map(t => {
              const cfg = typeConfig[t]
              const Icon = cfg.icon
              return (
                <button key={t} onClick={() => { setType(t); setCategoryId('') }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    type === t
                      ? `${cfg.color} border-transparent text-white shadow-md`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <Icon size={15} />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor (R$)</label>
            <input
              type="number" step="0.01" placeholder="0,00"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Data + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="confirmed">Confirmado</option>
                <option value="pending">Pendente</option>
                <option value="scheduled">Agendado</option>
              </select>
            </div>
          </div>

          {/* Conta */}
          <div className={type === 'transfer' ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {type === 'transfer' ? 'Conta Origem' : 'Conta'}
              </label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Selecione...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {type === 'transfer' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conta Destino</label>
                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Selecione...</option>
                  {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Categoria */}
          {type !== 'transfer' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Selecione...</option>
                {catsFiltradas.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {subCats.length > 0 && subCats.map(c => (
                  <option key={c.id} value={c.id}>  ↳ {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</label>
            <input type="text" placeholder="Ex: Salário março, Conta de luz..."
              value={description} onChange={e => setDescription(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Recorrência */}
          {!initial?.id && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Repetição</label>
              <div className="flex gap-2 mt-1">
                {[['single','Único'],['installment','Parcelado'],['fixed','Fixo Mensal']].map(([v,l]) => (
                  <button key={v} onClick={() => setRecType(v)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      recType === v ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>{l}</button>
                ))}
              </div>
              {recType === 'installment' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Parcelas:</span>
                  <input type="number" min={2} max={60} value={installments}
                    onChange={e => setInstallments(parseInt(e.target.value))}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
                  {amount && <span className="text-xs text-gray-400">{formatCurrency(parseFloat(amount||'0')/installments)}/mês</span>}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-sm ${
                typeConfig[type].color
              } hover:opacity-90 disabled:opacity-50`}>
              {saving ? 'Salvando...' : initial?.id ? 'Salvar Alterações' : 'Lançar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
