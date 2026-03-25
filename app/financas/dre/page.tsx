'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts'

export default function DrePage() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year,    setYear]    = useState(new Date().getFullYear())

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetch(`/api/fin/dre?year=${year}`).then(r => r.json())
    setData(d)
    setLoading(false)
  }, [year])

  useEffect(() => { load() }, [load])

  const evolucao   = data?.evolucao   ?? []
  const categorias = data?.categorias ?? []
  const receitas   = categorias.filter((c: any) => c.tipo === 'income')
  const despesas   = categorias.filter((c: any) => c.tipo === 'expense')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">DRE Gerencial</h2>
          <p className="text-gray-400 text-sm mt-1">Demonstrativo de Resultado do Exercício</p>
        </div>
        <div className="flex gap-2">
          {[year - 1, year, year + 1].map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                year === y ? 'bg-blue-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}>{y}</button>
          ))}
        </div>
      </div>

      {/* DRE resumo */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6 mb-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-5">Resultado {year}</h3>
        <div className="space-y-1">
          {[
            { label: 'Receita Total', value: data?.totalReceitas ?? 0, color: 'text-green-400', bold: false, indent: false },
            { label: '(-) Despesas',  value: data?.totalDespesas ?? 0, color: 'text-red-400',   bold: false, indent: true  },
            { label: '(=) Resultado', value: data?.resultado     ?? 0, color: (data?.resultado ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400', bold: true, indent: false },
          ].map((row, i) => (
            <div key={i} className={`flex items-center justify-between py-3 border-b border-gray-800 ${row.bold ? 'bg-gray-800 px-3 rounded-lg' : ''}`}>
              <span className={`text-sm ${row.indent ? 'pl-4 text-gray-400' : 'text-gray-200'} ${row.bold ? 'font-bold text-white' : ''}`}>{row.label}</span>
              <span className={`text-sm font-semibold ${row.color} ${row.bold ? 'text-base' : ''}`}>{formatCurrency(row.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 px-1">
            <span className="text-sm text-gray-500">Margem Líquida</span>
            <span className={`text-sm font-bold ${(data?.margem ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{data?.margem ?? 0}%</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-56 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : (
        <>
          {/* Gráfico evolução */}
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Evolução Mensal — {year}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={evolucao} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, n: any) => [formatCurrency(v), n === 'receitas' ? 'Receitas' : 'Despesas']}
                />
                <Legend formatter={v => v === 'receitas' ? 'Receitas' : 'Despesas'} />
                <Bar dataKey="receitas" fill="#10b981" radius={[4,4,0,0]} name="receitas" />
                <Bar dataKey="despesas" fill="#ef4444" radius={[4,4,0,0]} name="despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resultado mensal linha */}
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Resultado Líquido por Mês</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v), 'Resultado']}
                />
                <Line type="monotone" dataKey="resultado" stroke="#3b82f6" strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    return <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.resultado >= 0 ? '#10b981' : '#ef4444'} stroke="#111827" strokeWidth={2} />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detalhamento por categoria */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                <TrendingUp size={15} className="text-green-400" />
                <h3 className="text-sm font-semibold text-gray-300">Receitas por Categoria</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {receitas.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-gray-500 text-center">Nenhuma receita no período.</p>
                ) : receitas.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800 transition-colors">
                    <span className="text-sm text-gray-300">{c.nome}</span>
                    <span className="text-sm font-bold text-green-400">{formatCurrency(c.total)}</span>
                  </div>
                ))}
                {receitas.length > 0 && (
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-800/50">
                    <span className="text-sm font-bold text-gray-200">Total</span>
                    <span className="text-sm font-bold text-green-400">{formatCurrency(data?.totalReceitas ?? 0)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                <TrendingDown size={15} className="text-red-400" />
                <h3 className="text-sm font-semibold text-gray-300">Despesas por Categoria</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {despesas.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-gray-500 text-center">Nenhuma despesa no período.</p>
                ) : despesas.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800 transition-colors">
                    <span className="text-sm text-gray-300">{c.nome}</span>
                    <span className="text-sm font-bold text-red-400">{formatCurrency(c.total)}</span>
                  </div>
                ))}
                {despesas.length > 0 && (
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-800/50">
                    <span className="text-sm font-bold text-gray-200">Total</span>
                    <span className="text-sm font-bold text-red-400">{formatCurrency(data?.totalDespesas ?? 0)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
