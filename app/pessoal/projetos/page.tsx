'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, FolderOpen, Check, X, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react'

const ICONS = ['📁','✈️','🏠','🚗','🎓','💒','🎉','🏋️','💻','🛒','🏥','🐾','🌴','🔨','🎁']
const STATUS_OPT = [{ v:'active', l:'Em andamento' },{ v:'completed', l:'Concluído' },{ v:'cancelled', l:'Cancelado' }]

export default function ProjetosPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState<any>(null)
  const [saving,   setSaving]   = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [txs,      setTxs]      = useState<Record<string, any[]>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/pf/projects').then(r => r.json())
    setProjects(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const expandProject = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!txs[id]) {
      const data = await fetch(`/api/pf/transactions?project_id=${id}`).then(r => r.json())
      setTxs(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }))
    }
  }

  const handleSave = async () => {
    if (!form?.name) return
    setSaving(true)
    await fetch('/api/pf/projects', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false); setForm(null); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir projeto? Os lançamentos vinculados serão desvinculados.')) return
    await fetch('/api/pf/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const statusColor: Record<string, string> = {
    active:    'bg-emerald-950 text-emerald-400 border-emerald-800',
    completed: 'bg-blue-950 text-blue-400 border-blue-800',
    cancelled: 'bg-gray-800 text-gray-500 border-gray-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Projetos</h2>
          <p className="text-gray-400 text-sm mt-1">Orçamentos temporários — viagem, reforma, evento</p>
        </div>
        <button onClick={() => setForm({ name:'', budget:0, color:'#6b7280', icon:'📁', status:'active' })}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
          <Plus size={16} /> Novo Projeto
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-24 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : projects.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 py-16 text-center">
          <FolderOpen size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Nenhum projeto criado ainda.</p>
          <button onClick={() => setForm({ name:'', budget:0, color:'#6b7280', icon:'📁', status:'active' })}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
            Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => {
            const over = p.budget > 0 && p.spent > p.budget
            const warn = p.budget > 0 && p.percent >= 80
            const isExp = expanded === p.id
            const projTxs = txs[p.id] ?? []

            return (
              <div key={p.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: p.color + '22', border: `1.5px solid ${p.color}44` }}>
                        {p.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{p.name}</h3>
                        {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusColor[p.status]}`}>
                            {STATUS_OPT.find(s => s.v === p.status)?.l}
                          </span>
                          {p.start_date && (
                            <span className="text-[10px] text-gray-600">
                              {new Date(p.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                              {p.end_date && ` → ${new Date(p.end_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setForm(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Orçamento */}
                  {p.budget > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">
                          Gasto: <span className={`font-bold ${over ? 'text-red-400' : 'text-white'}`}>{formatCurrency(p.spent)}</span>
                          {' '}de {formatCurrency(p.budget)}
                        </span>
                        <span className={`text-xs font-bold ${over ? 'text-red-400' : warn ? 'text-yellow-400' : 'text-emerald-400'}`}>{p.percent}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <div className="h-2 rounded-full transition-all" style={{
                          width: `${Math.min(100, p.percent)}%`,
                          background: over ? '#ef4444' : warn ? '#f59e0b' : p.color
                        }} />
                      </div>
                      {over
                        ? <p className="text-xs text-red-400">Ultrapassou em {formatCurrency(p.spent - p.budget)}</p>
                        : <p className="text-xs text-gray-500">Restam {formatCurrency(p.remaining)}</p>}
                    </>
                  )}

                  {p.budget === 0 && (
                    <p className="text-xs text-gray-500">{formatCurrency(p.spent)} gastos · {p.count} lançamento(s)</p>
                  )}

                  {/* Expandir */}
                  <button onClick={() => expandProject(p.id)}
                    className="w-full flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    {isExp ? <><ChevronUp size={13} /> Ocultar lançamentos</> : <><ChevronDown size={13} /> Ver {p.count} lançamento(s)</>}
                  </button>
                </div>

                {/* Lançamentos expandidos */}
                {isExp && (
                  <div className="border-t border-gray-800">
                    {projTxs.length === 0 ? (
                      <div className="px-5 py-4 text-center text-xs text-gray-500">
                        Nenhum lançamento vinculado a este projeto.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {projTxs.map((tx: any) => (
                          <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/40 transition-colors">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-950' : 'bg-red-950'}`}>
                              {tx.type === 'income' ? <TrendingUp size={13} className="text-emerald-400" /> : <TrendingDown size={13} className="text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-200 truncate">{tx.description || tx.category?.name || '—'}</p>
                              <p className="text-[10px] text-gray-500">
                                {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                {tx.category && ` · ${tx.category.icon ?? ''} ${tx.category.name}`}
                              </p>
                            </div>
                            <p className={`text-xs font-bold flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.type === 'income' ? '+' : '−'}{formatCurrency(Number(tx.amount))}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal projeto */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800 my-4">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{form.id ? 'Editar Projeto' : 'Novo Projeto'}</h3>
              <button onClick={() => setForm(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Ícone */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ícone</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm({...form, icon: ic})}
                      className={`w-9 h-9 rounded-xl text-lg transition-all ${form.icon === ic ? 'ring-2 ring-emerald-500 bg-gray-800' : 'hover:bg-gray-800'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nome</label>
                <input type="text" placeholder="Ex: Viagem para Cancún"
                  value={form.name ?? ''}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descrição (opcional)</label>
                <input type="text" placeholder="Detalhes do projeto..."
                  value={form.description ?? ''}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Orçamento (R$)</label>
                <input type="number" step="0.01" placeholder="0,00 = sem limite"
                  value={form.budget ?? ''}
                  onChange={e => setForm({...form, budget: parseFloat(e.target.value) || 0})}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Início</label>
                  <input type="date" value={form.start_date ?? ''}
                    onChange={e => setForm({...form, start_date: e.target.value})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fim</label>
                  <input type="date" value={form.end_date ?? ''}
                    onChange={e => setForm({...form, end_date: e.target.value})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cor</label>
                  <input type="color" value={form.color ?? '#6b7280'}
                    onChange={e => setForm({...form, color: e.target.value})}
                    className="mt-1 w-full h-10 bg-gray-800 border border-gray-700 rounded-xl cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
                  <select value={form.status ?? 'active'} onChange={e => setForm({...form, status: e.target.value})}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    {STATUS_OPT.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.name}
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
