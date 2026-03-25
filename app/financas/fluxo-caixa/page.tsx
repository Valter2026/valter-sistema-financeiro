'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
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

  const fluxo         = data?.fluxo ?? []
  const totalReceitas = fluxo.reduce((a: number, m: any) => a + m.receitas, 0)
  const totalDespesas = fluxo.reduce((a: number, m: any) => a + m.despesas, 0)
  const resultado     = totalReceitas - totalDespesas
  const saldoFinal    = fluxo[fluxo.length - 1]?.saldo ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Fluxo de Caixa</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">Realizado + projetado por mês</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border-l-4 border-green-500 bg-green-950 p-3 md:p-5">
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">Total Receitas</p>
          <p className="text-sm md:text-xl font-bold text-white tabular-nums truncate">{formatCurrency(totalReceitas)}</p>
          <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><TrendingUp size={9} /> no ano</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-3 md:p-5">
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">Total Despesas</p>
          <p className="text-sm md:text-xl font-bold text-white tabular-nums truncate">{formatCurrency(totalDespesas)}</p>
          <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><TrendingDown size={9} /> no ano</p>
        </div>
        <div className={`rounded-xl border-l-4 p-3 md:p-5 ${resultado >= 0 ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">Resultado Anual</p>
          <p className={`text-sm md:text-xl font-bold tabular-nums truncate ${resultado >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(resultado)}</p>
          <p className={`text-[10px] mt-1 ${resultado >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{resultado >= 0 ? '▲ superávit' : '▼ déficit'}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-3 md:p-5 ${saldoFinal >= 0 ? 'border-yellow-500 bg-yellow-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">Saldo Final</p>
          <p className={`text-sm md:text-xl font-bold tabular-nums truncate ${saldoFinal >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(saldoFinal)}</p>
          <p className="text-[10px] text-gray-400 mt-1">acumulado {year}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-64 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : (
        <>
          {/* Gráfico receitas x despesas */}
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Receitas × Despesas por Mês — {year}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fluxo} barSize={18}>
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

          {/* Gráfico saldo acumulado */}
          <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Evolução do Saldo — {year}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={fluxo}>
                <defs>
                  <linearGradient id="gSaldoFC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v), 'Saldo']}
                />
                <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="url(#gSaldoFC)" strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    return <circle key={cx} cx={cx} cy={cy} r={3} fill={payload.saldo >= 0 ? '#3b82f6' : '#ef4444'} />
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela mensal */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300">Detalhamento Mensal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800 bg-gray-800/50">
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide">Mês</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Receitas</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Despesas</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Resultado</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Saldo Acum.</th>
                  </tr>
                </thead>
                <tbody>
                  {fluxo.map((m: any, i: number) => (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-200">{m.label}/{year}</td>
                      <td className="px-5 py-3 text-right text-green-400 font-medium">{formatCurrency(m.receitas)}</td>
                      <td className="px-5 py-3 text-right text-red-400 font-medium">{formatCurrency(m.despesas)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          m.resultado >= 0 ? 'text-green-400 bg-green-950 border border-green-800' : 'text-red-400 bg-red-950 border border-red-800'
                        }`}>
                          {m.resultado >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {formatCurrency(Math.abs(m.resultado))}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-bold ${m.saldo >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatCurrency(m.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-700 bg-gray-800/50">
                    <td className="px-5 py-3 font-bold text-white">TOTAL {year}</td>
                    <td className="px-5 py-3 text-right font-bold text-green-400">{formatCurrency(totalReceitas)}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-400">{formatCurrency(totalDespesas)}</td>
                    <td className="px-5 py-3 text-right font-bold">
                      <span className={resultado >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(resultado)}</span>
                    </td>
                    <td className={`px-5 py-3 text-right font-bold ${saldoFinal >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
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
