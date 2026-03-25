'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, AlertTriangle, CheckCircle, Pencil, Trash2 } from 'lucide-react'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function OrcamentoPage() {
  const now = new Date()
  const [mes,     setMes]     = useState(now.getMonth() + 1)
  const [ano,     setAno]     = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<any[]>([])
  const [cats,    setCats]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState<any>(null)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [b, c] = await Promise.all([
      fetch(`/api/pf/budgets?month=${mes}&year=${ano}`).then(r => r.json()),
      fetch('/api/pf/categories').then(r => r.json()),
    ])
    setBudgets(Array.isArray(b) ? b : [])
    setCats(Array.isArray(c) ? c.filter((x: any) => x.type === 'expense' && !x.parent_id) : [])
    setLoading(false)
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form?.category_id || !form?.amount) return
    setSaving(true)
    await fetch('/api/pf/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, month: mes, year: ano }),
    })
    setSaving(false); setForm(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover orçamento?')) return
    await fetch('/api/pf/budgets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const totalOrcado = budgets.reduce((a, b) => a + b.amount, 0)
  const totalGasto  = budgets.reduce((a, b) => a + b.spent, 0)
  const catsSemOrcamento = cats.filter(c => !budgets.find(b => b.category_id === c.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Orçamento</h2>
          <p className="text-gray-400 text-sm mt-1">Controle de gastos por categoria</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button onClick={() => { const d = new Date(ano, mes-2, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">‹</button>
            <span className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl">{MONTHS[mes-1]} {ano}</span>
            <button onClick={() => { const d = new Date(ano, mes, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">›</button>
          </div>
          <button onClick={() => setForm({ amount: 0 })}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
            <Plus size={16} /> Definir Limite
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-950 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Orçado</p>
          <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalOrcado)}</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Gasto</p>
          <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalGasto)}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-5 ${totalGasto <= totalOrcado ? 'border-emerald-500 bg-emerald-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Disponível</p>
          <p className={`text-2xl font-bold ${totalGasto <= totalOrcado ? 'text-white' : 'text-red-400'}`}>{formatCurrency(totalOrcado - totalGasto)}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 py-16 text-center">
          <p className="text-gray-500 text-sm mb-4">Nenhum orçamento definido para {MONTHS[mes-1]}.</p>
          <button onClick={() => setForm({ amount: 0 })}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
            Definir primeiro limite
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map(b => {
            const over = b.percent >= 100
            const warn = b.percent >= 80
            return (
              <div key={b.id} className={`bg-gray-900 rounded-xl border p-5 ${over ? 'border-red-800' : warn ? 'border-yellow-800' : 'border-gray-800'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{b.category?.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{b.category?.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(b.spent)} de {formatCurrency(b.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {over ? <AlertTriangle size={14} className="text-red-400" /> : <CheckCircle size={14} className="text-emerald-400" />}
                    <span className={`text-sm font-bold ${over ? 'text-red-400' : warn ? 'text-yellow-400' : 'text-emerald-400'}`}>{b.percent}%</span>
                    <button onClick={() => setForm(b)} className="p-1 rounded text-gray-500 hover:text-gray-300"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1 rounded text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all" style={{
                    width: `${Math.min(100, b.percent)}%`,
                    background: over ? '#ef4444' : warn ? '#f59e0b' : '#10b981'
                  }} />
                </div>
                {over && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <AlertTriangle size={10} /> Ultrapassou em {formatCurrency(b.spent - b.amount)}
                  </p>
                )}
                {!over && (
                  <p className="text-xs text-gray-500 mt-2">Restam {formatCurrency(b.remaining)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Definir Limite de Gasto</h3>
            </div>
            <div className="p-6 space-y-4">
              {!form.id && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoria</label>
                  <select value={form.category_id ?? ''} onChange={e => setForm({...form, category_id: e.target.value})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                    <option value="">Selecione...</option>
                    {catsSemOrcamento.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                    {cats.filter(c => budgets.find(b => b.category_id === c.id)).map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name} (editar)</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Limite Mensal (R$)</label>
                <input type="number" step="0.01" value={form.amount ?? ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})}
                  placeholder="Ex: 500,00"
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
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
