'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, CreditCard, Banknote, PiggyBank, Wallet } from 'lucide-react'

const TYPES: Record<string, { label: string; icon: any }> = {
  checking:    { label: 'Conta Corrente',    icon: CreditCard },
  savings:     { label: 'Poupança',          icon: PiggyBank  },
  credit_card: { label: 'Cartão de Crédito', icon: CreditCard },
  cash:        { label: 'Dinheiro/Caixa',    icon: Banknote   },
  investment:  { label: 'Investimento',      icon: Wallet     },
  other:       { label: 'Outros',            icon: Wallet     },
}

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316']

export default function ContasPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState<any>(null)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/fin/accounts').then(r => r.json())
    setAccounts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form?.name || !form?.type) return
    setSaving(true)
    await fetch('/api/fin/accounts', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false); setForm(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta conta?')) return
    await fetch('/api/fin/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Contas</h2>
          <p className="text-gray-400 text-sm mt-1">Bancos, cartões, caixa e investimentos</p>
        </div>
        <button onClick={() => setForm({ color: COLORS[0], type: 'checking', opening_balance: 0 })}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="h-32 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 py-20 text-center">
          <Wallet size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Nenhuma conta cadastrada.</p>
          <button onClick={() => setForm({ color: COLORS[0], type: 'checking', opening_balance: 0 })}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
            Criar primeira conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const cfg  = TYPES[acc.type] ?? TYPES.other
            const Icon = cfg.icon
            return (
              <div key={acc.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gray-800">
                      <Icon size={18} style={{ color: acc.color ?? '#3b82f6' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{acc.name}</p>
                      <p className="text-xs text-gray-500">{cfg.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setForm(acc)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(acc.id)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-800 pt-3">
                  <p className="text-xs text-gray-500 mb-1">Saldo inicial</p>
                  <p className="text-xl font-bold" style={{ color: acc.color ?? '#3b82f6' }}>
                    {formatCurrency(Number(acc.opening_balance ?? 0))}
                  </p>
                  {acc.bank && <p className="text-xs text-gray-600 mt-1">{acc.bank}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">{form.id ? 'Editar' : 'Nova'} Conta</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nome da Conta</label>
                <input type="text" value={form.name ?? ''} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ex: Bradesco, Nubank, Caixa..."
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</label>
                <select value={form.type ?? 'checking'} onChange={e => setForm({...form, type: e.target.value})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Banco / Instituição</label>
                <input type="text" value={form.bank ?? ''} onChange={e => setForm({...form, bank: e.target.value})}
                  placeholder="Ex: Itaú, Bradesco, Nubank..."
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Saldo Inicial (R$)</label>
                <input type="number" step="0.01" value={form.opening_balance ?? 0} onChange={e => setForm({...form, opening_balance: parseFloat(e.target.value)})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cor</label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({...form, color: c})}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : 'hover:scale-110'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
