'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line
} from 'recharts'

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
          <h2 className="text-2xl font-bold text-gray-900">DRE Gerencial</h2>
          <p className="text-gray-400 text-sm mt-1">Demonstrativo de Resultado do Exercício</p>
        </div>
        <div className="flex gap-2">
          {[year - 1, year, year + 1].map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                year === y ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'
              }`}>{y}</button>
          ))}
        </div>
      </div>

      {/* DRE resumo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-5">Resultado {year}</h3>
        <div className="space-y-1">
          {[
            { label: 'Receita Total',    value: data?.totalReceitas ?? 0, sign: +1, bold: false, green: true },
            { label: '(-) Despesas',     value: data?.totalDespesas ?? 0, sign: -1, bold: false, green: false },
            { label: '(=) Resultado',    value: data?.resultado ?? 0,     sign: +1, bold: true,  green: (data?.resultado ?? 0) >= 0 },
          ].map((row, i) => (
            <div key={i} className={`flex items-center justify-between py-3 px-4 ${row.bold ? 'bg-gray-50 rounded-xl border border-gray-200' : 'border-b border-gray-100'}`}>
              <span className={`text-sm ${row.bold ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{row.label}</span>
              <span className={`text-sm font-bold ${row.bold ? (row.green ? 'text-green-700 text-base' : 'text-red-600 text-base') : row.green ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 px-4">
            <span className="text-sm text-gray-400">Margem Líquida</span>
            <span className={`text-sm font-bold ${(data?.margem ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {data?.margem ?? 0}%
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-56 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
      ) : (
        <>
          {/* Gráfico evolução */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Evolução Mensal — {year}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={evolucao} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any, n: any) => [formatCurrency(v), n === 'receitas' ? 'Receitas' : n === 'despesas' ? 'Despesas' : 'Resultado']}
                />
                <Legend formatter={v => v === 'receitas' ? 'Receitas' : v === 'despesas' ? 'Despesas' : 'Resultado'} />
                <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} name="receitas" />
                <Bar dataKey="despesas" fill="#f87171" radius={[4, 4, 0, 0]} name="despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resultado mensal linha */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Resultado Líquido por Mês</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v), 'Resultado']}
                />
                <Line type="monotone" dataKey="resultado" stroke="#3b82f6" strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    return <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.resultado >= 0 ? '#22c55e' : '#ef4444'} stroke="#fff" strokeWidth={2} />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detalhamento por categoria */}
          <div className="grid grid-cols-2 gap-6">
            {/* Receitas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <h3 className="text-sm font-bold text-green-700 flex items-center gap-2">
                  <TrendingUp size={15} /> Receitas por Categoria
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {receitas.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-gray-400 text-center">Nenhuma receita no período.</p>
                ) : receitas.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                    <span className="text-sm text-gray-600">{c.nome}</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(c.total)}</span>
                  </div>
                ))}
                {receitas.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-3 bg-green-50">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="text-sm font-bold text-green-700">{formatCurrency(data?.totalReceitas ?? 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Despesas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-red-50 border-b border-red-100">
                <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
                  <TrendingDown size={15} /> Despesas por Categoria
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {despesas.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-gray-400 text-center">Nenhuma despesa no período.</p>
                ) : despesas.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                    <span className="text-sm text-gray-600">{c.nome}</span>
                    <span className="text-sm font-bold text-red-500">{formatCurrency(c.total)}</span>
                  </div>
                ))}
                {despesas.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-3 bg-red-50">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(data?.totalDespesas ?? 0)}</span>
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
