'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Download } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function exportCSV(days: any[], mes: number, ano: number) {
  const header = 'Data,Entradas,Saídas,Saldo do Dia,Saldo Acumulado'
  const rows = days.map(d => {
    const dt = new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR')
    return `${dt},${d.receitas.toFixed(2)},${d.despesas.toFixed(2)},${d.saldo.toFixed(2)},${d.acumulado.toFixed(2)}`
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `fluxo-caixa-${mes}-${ano}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function FluxoCaixaPage() {
  const now = new Date()
  const [mes,     setMes]     = useState(now.getMonth() + 1)
  const [ano,     setAno]     = useState(now.getFullYear())
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const m   = String(mes).padStart(2, '0')
    const res = await fetch(`/api/pf/cashflow?start=${ano}-${m}-01&end=${ano}-${m}-31`).then(r => r.json())
    setData(res)
    setLoading(false)
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const days = data?.days ?? []
  // Chart: mostra apenas dias com movimento ou a cada 3 dias
  const chartData = days
    .filter((_: any, i: number) => i % 2 === 0 || days[i]?.receitas > 0 || days[i]?.despesas > 0)
    .map((d: any) => ({
      ...d,
      label: new Date(d.date + 'T12:00:00').getDate() + '/' + (mes),
    }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Fluxo de Caixa</h2>
          <p className="text-gray-400 text-sm mt-1">Entradas e saídas dia a dia</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button onClick={() => { const d = new Date(ano, mes-2, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">‹</button>
            <span className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl">{MONTHS[mes-1]} {ano}</span>
            <button onClick={() => { const d = new Date(ano, mes, 1); setMes(d.getMonth()+1); setAno(d.getFullYear()) }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700">›</button>
          </div>
          <button onClick={() => exportCSV(days, mes, ano)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <Download size={13} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-950 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Entradas</p>
          <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(data?.totalReceitas ?? 0)}</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp size={11} /> {MONTHS[mes-1]}</p>
        </div>
        <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Saídas</p>
          <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(data?.totalDespesas ?? 0)}</p>
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><TrendingDown size={11} /> {MONTHS[mes-1]}</p>
        </div>
        <div className={`rounded-xl border-l-4 p-5 ${(data?.resultado ?? 0) >= 0 ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resultado do Mês</p>
          <p className={`text-2xl font-bold ${(data?.resultado ?? 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(data?.resultado ?? 0)}
          </p>
          <p className={`text-xs mt-1 ${(data?.resultado ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {(data?.resultado ?? 0) >= 0 ? '▲ sobrou' : '▼ gastou mais'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-48 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : (
        <>
          {/* Gráfico saldo acumulado */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Saldo Acumulado — {MONTHS[mes-1]}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gAcum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gAcumRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={56} />
                <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v), 'Acumulado']}
                />
                <Area type="monotone" dataKey="acumulado" stroke="#10b981" fill="url(#gAcum)" strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    const color = payload.acumulado >= 0 ? '#10b981' : '#ef4444'
                    return <circle key={cx} cx={cx} cy={cy} r={3} fill={color} stroke="#111827" strokeWidth={2} />
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela diária */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">Detalhamento Diário</h3>
              <span className="text-xs text-gray-500">{days.filter((d: any) => d.receitas > 0 || d.despesas > 0).length} dias com movimento</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800 bg-gray-800/50">
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide">Data</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Entradas</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Saídas</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Saldo do Dia</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wide text-right">Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d: any) => {
                    const hasMovimento = d.receitas > 0 || d.despesas > 0
                    if (!hasMovimento) return null
                    const dt = new Date(d.date + 'T12:00:00')
                    return (
                      <tr key={d.date} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3 text-gray-300 font-medium">
                          {dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="px-5 py-3 text-right text-emerald-400 font-medium">
                          {d.receitas > 0 ? formatCurrency(d.receitas) : <span className="text-gray-700">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-red-400 font-medium">
                          {d.despesas > 0 ? formatCurrency(d.despesas) : <span className="text-gray-700">—</span>}
                        </td>
                        <td className={`px-5 py-3 text-right font-bold ${d.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {d.saldo >= 0 ? '+' : ''}{formatCurrency(d.saldo)}
                        </td>
                        <td className={`px-5 py-3 text-right font-bold ${d.acumulado >= 0 ? 'text-white' : 'text-red-400'}`}>
                          {formatCurrency(d.acumulado)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-700 bg-gray-800/50">
                    <td className="px-5 py-3 font-bold text-gray-300">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-400">{formatCurrency(data?.totalReceitas ?? 0)}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-400">{formatCurrency(data?.totalDespesas ?? 0)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${(data?.resultado ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(data?.resultado ?? 0)}
                    </td>
                    <td className="px-5 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {days.every((d: any) => d.receitas === 0 && d.despesas === 0) && (
              <div className="py-16 text-center">
                <p className="text-gray-500 text-sm">Nenhum lançamento confirmado em {MONTHS[mes-1]}.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
