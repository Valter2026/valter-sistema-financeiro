'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area, ReferenceLine
} from 'recharts'

export default function FluxoCaixaPage() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year,    setYear]    = useState(new Date().getFullYear())

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetch(`/api/fin/cashflow?year=${year}`).then(r => r.json())
    setData(d)
    setLoading(false)
  }, [year])

  useEffect(() => { load() }, [load])

  const fluxo = data?.fluxo ?? []
  const totalReceitas = fluxo.reduce((a: number, m: any) => a + m.receitas, 0)
  const totalDespesas = fluxo.reduce((a: number, m: any) => a + m.despesas, 0)
  const resultado     = totalReceitas - totalDespesas
  const saldoFinal    = fluxo[fluxo.length - 1]?.saldo ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h2>
          <p className="text-gray-400 text-sm mt-1">Realizado + projetado por mês</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Receitas', value: totalReceitas, color: 'text-green-600', bg: 'bg-green-50 border-green-100', icon: TrendingUp, iconColor: 'text-green-600' },
          { label: 'Total Despesas', value: totalDespesas, color: 'text-red-500',   bg: 'bg-red-50 border-red-100',    icon: TrendingDown, iconColor: 'text-red-500' },
          { label: 'Resultado Anual', value: resultado,    color: resultado >= 0 ? 'text-blue-700' : 'text-red-600', bg: resultado >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100', icon: resultado >= 0 ? TrendingUp : TrendingDown, iconColor: resultado >= 0 ? 'text-blue-600' : 'text-red-600' },
          { label: 'Saldo Final', value: saldoFinal, color: saldoFinal >= 0 ? 'text-gray-900' : 'text-red-600', bg: 'bg-white border-gray-100', icon: saldoFinal >= 0 ? TrendingUp : TrendingDown, iconColor: saldoFinal >= 0 ? 'text-gray-500' : 'text-red-500' },
        ].map(({ label, value, color, bg, icon: Icon, iconColor }, i) => (
          <div key={i} className={`rounded-2xl p-5 border shadow-sm ${bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <Icon size={16} className={iconColor} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_,i) => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
      ) : (
        <>
          {/* Gráfico receitas x despesas */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Receitas × Despesas por Mês — {year}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fluxo} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any, n: any) => [formatCurrency(v), n === 'receitas' ? 'Receitas' : 'Despesas']}
                />
                <Legend formatter={v => v === 'receitas' ? 'Receitas' : 'Despesas'} />
                <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} name="receitas" />
                <Bar dataKey="despesas" fill="#f87171" radius={[4, 4, 0, 0]} name="despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico saldo acumulado */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Evolução do Saldo — {year}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={fluxo}>
                <defs>
                  <linearGradient id="gSaldoFC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v), 'Saldo']}
                />
                <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="url(#gSaldoFC)" strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    return <circle key={cx} cx={cx} cy={cy} r={3} fill={payload.saldo >= 0 ? '#3b82f6' : '#ef4444'} />
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela mensal */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">Detalhamento Mensal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 font-semibold">Mês</th>
                    <th className="px-5 py-3 font-semibold text-right">Receitas</th>
                    <th className="px-5 py-3 font-semibold text-right">Despesas</th>
                    <th className="px-5 py-3 font-semibold text-right">Resultado</th>
                    <th className="px-5 py-3 font-semibold text-right">Saldo Acum.</th>
                  </tr>
                </thead>
                <tbody>
                  {fluxo.map((m: any, i: number) => {
                    const res = m.resultado
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-800">{m.label}/{year}</td>
                        <td className="px-5 py-3 text-right text-green-600 font-medium">{formatCurrency(m.receitas)}</td>
                        <td className="px-5 py-3 text-right text-red-500 font-medium">{formatCurrency(m.despesas)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            res >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                          }`}>
                            {res >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {formatCurrency(Math.abs(res))}
                          </span>
                        </td>
                        <td className={`px-5 py-3 text-right font-bold ${m.saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                          {formatCurrency(m.saldo)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-5 py-3 font-bold text-gray-900">TOTAL {year}</td>
                    <td className="px-5 py-3 text-right font-bold text-green-600">{formatCurrency(totalReceitas)}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-500">{formatCurrency(totalDespesas)}</td>
                    <td className="px-5 py-3 text-right font-bold">
                      <span className={`text-sm ${resultado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(resultado)}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-bold ${saldoFinal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatCurrency(saldoFinal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
