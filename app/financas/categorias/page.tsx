'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#10b981','#f97316','#6366f1']

export default function CategoriasPage() {
  const [cats,    setCats]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState<any>(null)
  const [aba,     setAba]     = useState<'expense'|'income'>('expense')
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/fin/categories').then(r => r.json())
    setCats(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form?.name) return
    setSaving(true)
    const method = form.id ? 'PUT' : 'POST'
    await fetch('/api/fin/categories', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: form.type ?? aba }),
    })
    setSaving(false); setForm(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir categoria?')) return
    await fetch('/api/fin/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const pais   = cats.filter(c => c.type === aba && !c.parent_id)
  const filhos = cats.filter(c => c.type === aba && c.parent_id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
          <p className="text-gray-400 text-sm mt-1">Organize suas receitas e despesas</p>
        </div>
        <button onClick={() => setForm({ type: aba, color: COLORS[0] })}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6">
        {([['expense','Despesas'],['income','Receitas']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setAba(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              aba === k
                ? k === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'bg-green-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            {k === 'expense' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
      ) : pais.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">Nenhuma categoria de {aba === 'expense' ? 'despesa' : 'receita'} cadastrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {pais.map(pai => {
            const subs = filhos.filter(f => f.parent_id === pai.id)
            return (
              <div key={pai.id}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: pai.color ?? '#6b7280' }} />
                    <span className="text-sm font-semibold text-gray-800">{pai.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setForm({ type: aba, color: COLORS[0], parent_id: pai.id })}
                      title="Adicionar subcategoria"
                      className="px-2 py-1 rounded-lg text-xs text-blue-500 hover:bg-blue-50 font-medium transition-colors">
                      + sub
                    </button>
                    <button onClick={() => setForm(pai)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(pai.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {subs.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between pl-12 pr-5 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: sub.color ?? '#9ca3af' }} />
                      <span className="text-sm text-gray-500">{sub.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setForm(sub)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(sub.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {form.id ? 'Editar' : 'Nova'} {form.parent_id ? 'Subcategoria' : 'Categoria'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</label>
                <input type="text" value={form.name ?? ''} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ex: Marketing, Aluguel..."
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              {!form.parent_id && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</label>
                  <select value={form.type ?? aba} onChange={e => setForm({...form, type: e.target.value})}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cor</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({...form, color: c})}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setForm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
