'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Target, CheckCircle } from 'lucide-react'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316']
const ICONS  = ['🎯','🏠','🚗','✈️','📚','💍','🏖️','💻','🎸','💰','🏋️','🎓']

export default function MetasPage() {
  const [goals,   setGoals]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState<any>(null)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/pf/goals').then(r => r.json())
    setGoals(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form?.name || !form?.target_amount) return
    setSaving(true)
    await fetch('/api/pf/goals', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false); setForm(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta meta?')) return
    await fetch('/api/pf/goals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const handleComplete = async (goal: any) => {
    await fetch('/api/pf/goals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: goal.id, status: 'completed', current_amount: goal.target_amount }) })
    load()
  }

  const ativas     = goals.filter(g => g.status === 'active')
  const concluidas = goals.filter(g => g.status === 'completed')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Metas</h2>
          <p className="text-gray-400 text-sm mt-1">Seus objetivos financeiros</p>
        </div>
        <button onClick={() => setForm({ color: COLORS[0], icon: '🎯', current_amount: 0 })}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
          <Plus size={16} /> Nova Meta
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-48 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : (
        <>
          {ativas.length === 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 py-16 text-center mb-6">
              <Target size={36} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">Nenhuma meta cadastrada.</p>
              <button onClick={() => setForm({ color: COLORS[0], icon: '🎯', current_amount: 0 })}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
                Criar primeira meta
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {ativas.map(g => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
              const falta = g.target_amount - g.current_amount
              return (
                <div key={g.id} className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: g.color + '20' }}>
                        {g.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{g.name}</h3>
                        {g.target_date && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            até {new Date(g.target_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleComplete(g)} title="Marcar como concluída"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-emerald-950 hover:text-emerald-400 transition-colors">
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => setForm(g)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-700 hover:text-gray-200 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-red-950 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>{formatCurrency(g.current_amount)} guardado</span>
                      <span className="font-bold" style={{ color: g.color }}>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>Faltam {formatCurrency(falta)}</span>
                      <span>Meta: {formatCurrency(g.target_amount)}</span>
                    </div>
                  </div>

                  {/* Atualizar progresso */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                    <input type="number" step="0.01" placeholder="Adicionar valor..."
                      id={`add-${g.id}`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    <button onClick={async () => {
                      const el = document.getElementById(`add-${g.id}`) as HTMLInputElement
                      const add = parseFloat(el.value)
                      if (!add) return
                      const newVal = Math.min(g.target_amount, g.current_amount + add)
                      await fetch('/api/pf/goals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: g.id, current_amount: newVal, status: newVal >= g.target_amount ? 'completed' : 'active' }) })
                      el.value = ''; load()
                    }} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
                      + Guardar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {concluidas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" /> Metas concluídas ({concluidas.length})
              </h3>
              <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
                {concluidas.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{g.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-300 line-through">{g.name}</p>
                        <p className="text-xs text-emerald-400">{formatCurrency(g.target_amount)} atingido!</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">{form.id ? 'Editar' : 'Nova'} Meta</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nome da Meta</label>
                <input type="text" value={form.name ?? ''} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ex: Viagem, Carro, Reserva de emergência..."
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Valor Alvo (R$)</label>
                  <input type="number" step="0.01" value={form.target_amount ?? ''} onChange={e => setForm({...form, target_amount: parseFloat(e.target.value)})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Já guardei (R$)</label>
                  <input type="number" step="0.01" value={form.current_amount ?? 0} onChange={e => setForm({...form, current_amount: parseFloat(e.target.value)})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data limite (opcional)</label>
                <input type="date" value={form.target_date ?? ''} onChange={e => setForm({...form, target_date: e.target.value})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ícone</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm({...form, icon: ic})}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === ic ? 'bg-emerald-600 scale-110' : 'bg-gray-800 hover:bg-gray-700'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
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
