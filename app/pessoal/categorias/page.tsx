'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6']
const ICONS  = ['🏠','🍔','🚗','❤️','📚','🎬','👕','💆','🏦','📦','💼','💻','📈','🏘️','💰','✈️','🎯','🛒','⚡','💧']

export default function PfCategoriasPage() {
  const [cats,    setCats]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState<any>(null)
  const [aba,     setAba]     = useState<'expense'|'income'>('expense')
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/pf/categories').then(r => r.json())
    setCats(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form?.name) return
    setSaving(true)
    await fetch('/api/pf/categories', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: form.type ?? aba }),
    })
    setSaving(false); setForm(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir categoria?')) return
    await fetch('/api/pf/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const pais   = cats.filter(c => c.type === aba && !c.parent_id)
  const filhos = cats.filter(c => c.type === aba && c.parent_id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Categorias</h2>
          <p className="text-gray-400 text-sm mt-1">Organize seus gastos e receitas</p>
        </div>
        <button onClick={() => setForm({ type: aba, color: COLORS[0], icon: ICONS[0] })}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {([['expense','Gastos'],['income','Receitas']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setAba(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              aba === k
                ? k === 'expense' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}>
            {k === 'expense' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-14 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : pais.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 py-16 text-center">
          <p className="text-gray-500 text-sm">Nenhuma categoria de {aba === 'expense' ? 'gasto' : 'receita'} cadastrada.</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {pais.map(pai => {
            const subs = filhos.filter(f => f.parent_id === pai.id)
            return (
              <div key={pai.id}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{pai.icon}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: pai.color ?? '#6b7280' }} />
                    <span className="text-sm font-semibold text-gray-200">{pai.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setForm({ type: aba, color: pai.color, icon: ICONS[0], parent_id: pai.id })}
                      className="px-2 py-1 rounded-lg text-xs text-emerald-400 hover:bg-emerald-950 font-medium transition-colors">
                      + sub
                    </button>
                    <button onClick={() => setForm(pai)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-700 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(pai.id)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {subs.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between pl-12 pr-5 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: sub.color ?? '#6b7280' }} />
                      <span className="text-sm text-gray-400">{sub.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setForm(sub)} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-700 transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">
                {form.id ? 'Editar' : 'Nova'} {form.parent_id ? 'Subcategoria' : 'Categoria'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nome</label>
                <input type="text" value={form.name ?? ''} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ex: Supermercado, Salário..."
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              {!form.parent_id && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</label>
                  <select value={form.type ?? aba} onChange={e => setForm({...form, type: e.target.value})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                    <option value="expense">Gasto</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              )}
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
                <div className="flex gap-2 mt-2 flex-wrap">
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
