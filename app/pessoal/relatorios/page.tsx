'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Download } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function exportCSV(txs: any[], mes: number, ano: number) {
  const header = 'Data,Tipo,Descrição,Categoria,Conta,Valor'
  const rows = txs.map(t => {
    const dt   = new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')
    const tipo = t.type === 'income' ? 'Receita' : 'Gasto'
    const cat  = t.category?.name ?? ''
    const acc  = t.account?.name  ?? ''
    const val  = Number(t.amount).toFixed(2)
    const desc = (t.description ?? '').replace(/,/g, ' ')
    return `${dt},${tipo},"${desc}","${cat}","${acc}",${val}`
  })
  const csv  = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `relatorio-${mes}-${ano}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function PfRelatoriosPage() {
  const now = new Date()
  const [mes,     setMes]     = useState(now.getMonth() + 1)
  const [ano,     setAno]     = useState(now.getFullYear())
  const [txs,     setTxs]     = useState<any[]>([])
  const [chart,   setChart]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const m = String(mes).padStart(2, '0')
    const [t] = await Promise.all([
      fetch(`/api/pf/transactions?month=${mes}&year=${ano}&status=confirmed`).then(r => r.json()),
    ])
    setTxs(Array.isArray(t) ? t : [])

    // Gráfico 12 meses
    const chartData = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const d = new Date(ano, i, 1)
        const mm = String(d.getMonth()+1).padStart(2,'0')
        return fetch(`/api/pf/summary?start=${ano}-${mm}-01&end=${ano}-${mm}-31`)
          .then(r => r.json())
          .then(r => ({ label: MONTHS[i], receitas: r.receitas ?? 0, despesas: r.despesas ?? 0, resultado: (r.receitas ?? 0) - (r.despesas ?? 0) }))
      })
    )
    setChart(chartData)
    setLoading(false)
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const despesas = txs.filter(t => t.type === 'expense')
  const receitas = txs.filter(t => t.type === 'income')

  // Agrupa por categoria
  const byCategory: Record<string, { name: string; color: string; icon: string; total: number }> = {}
  despesas.forEach(t => {
    const k = t.category_id ?? 'sem-cat'
    if (!byCategory[k]) byCategory[k] = { name: t.category?.name ?? 'Sem categoria', color: t.category?.color ?? '#6b7280', icon: t.category?.icon ?? '📦', total: 0 }
    byCategory[k].total += Number(t.amount)
  })
  const pieData = Object.values(byCategory).sort((a, b) => b.total - a.total)

  const totalDespesas = despesas.reduce((a, t) => a + Number(t.amount), 0)
  const totalReceitas = receitas.reduce((a, t) => a + Number(t.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Relatórios</h2>
          <p className="text-gray-400 text-sm mt-1">Análise detalhada das suas finanças</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button onClick={() => { const d = new Date(ano, mes-2, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">‹</button>
            <span className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl">{MONTHS[mes-1]}/{ano}</span>
            <button onClick={() => { const d = new Date(ano, mes, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">›</button>
          </div>
          <button onClick={() => exportCSV(txs, mes, ano)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* KPIs do mês */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-950 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Receitas</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalReceitas)}</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp size={11} /> {MONTHS[mes-1]}</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Gastos</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalDespesas)}</p>
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><TrendingDown size={11} /> {MONTHS[mes-1]}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-5 ${totalReceitas >= totalDespesas ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resultado</p>
          <p className={`text-2xl font-bold ${totalReceitas >= totalDespesas ? 'text-white' : 'text-red-400'}`}>{formatCurrency(totalReceitas - totalDespesas)}</p>
          <p className={`text-xs mt-1 ${totalReceitas >= totalDespesas ? 'text-blue-400' : 'text-red-400'}`}>{totalReceitas >= totalDespesas ? '▲ sobrou' : '▼ gastou mais'}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-64 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Pizza de gastos por categoria */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Gastos por Categoria</h3>
              {pieData.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Sem gastos no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [formatCurrency(v)]}
                    />
                    <Legend formatter={(v) => v} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Ranking de categorias */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Onde mais gastou</h3>
              {pieData.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Sem gastos no período.</p>
              ) : (
                <div className="space-y-3">
                  {pieData.slice(0, 6).map((c, i) => {
                    const pct = Math.round((c.total / totalDespesas) * 100)
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300 flex items-center gap-2">
                            <span>{c.icon}</span>{c.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{pct}%</span>
                            <span className="text-sm font-bold text-red-400">{formatCurrency(c.total)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Evolução anual */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Receitas × Gastos — {ano}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chart} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, n: any) => [formatCurrency(v), n === 'receitas' ? 'Receitas' : 'Gastos']}
                />
                <Legend formatter={v => v === 'receitas' ? 'Receitas' : 'Gastos'} />
                <Bar dataKey="receitas" fill="#10b981" radius={[4,4,0,0]} name="receitas" />
                <Bar dataKey="despesas" fill="#ef4444" radius={[4,4,0,0]} name="despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resultado acumulado */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Sobra/Falta por Mês — {ano}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="gPfRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v), 'Resultado']}
                />
                <Area type="monotone" dataKey="resultado" stroke="#10b981" fill="url(#gPfRes)" strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    return <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.resultado >= 0 ? '#10b981' : '#ef4444'} stroke="#111827" strokeWidth={2} />
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
