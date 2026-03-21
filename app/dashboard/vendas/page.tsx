'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import KpiCard from '@/components/ui/KpiCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function VendasPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/eduzz/vendas?period=${period}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [period])

  const periods = [
    { label: '7 dias', value: '7d' },
    { label: '30 dias', value: '30d' },
    { label: '90 dias', value: '90d' },
    { label: '12 meses', value: '12m' },
    { label: 'Histórico', value: 'all' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Vendas</h2>
          <p className="text-gray-400 text-sm mt-1">Histórico completo da Eduzz</p>
        </div>
        <div className="flex gap-2">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.value ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-3 gap-4"><div className="col-span-3 h-48 bg-gray-800 rounded-xl animate-pulse" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <KpiCard title="Faturamento Total" value={formatCurrency(data?.totalFaturamento ?? 0)} color="green" />
            <KpiCard title="Total de Vendas" value={String(data?.totalVendas ?? 0)} color="blue" />
            <KpiCard title="Ticket Médio" value={formatCurrency(data?.ticketMedio ?? 0)} color="purple" />
          </div>

          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Faturamento por Dia</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.graficoDiario ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="data" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => v.substring(5)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v: any) => [formatCurrency(v), 'Faturamento']}
                />
                <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Desempenho por Produto</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 font-medium text-right">Vendas</th>
                    <th className="pb-3 font-medium text-right">Faturamento</th>
                    <th className="pb-3 font-medium text-right">Ticket Médio</th>
                    <th className="pb-3 font-medium text-right">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.porProduto ?? []).map((p: any, i: number) => (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="py-3 text-gray-500">{i + 1}</td>
                      <td className="py-3 text-white max-w-xs truncate">{p.nome}</td>
                      <td className="py-3 text-right text-gray-300">{p.vendas}</td>
                      <td className="py-3 text-right text-green-400 font-semibold">{formatCurrency(p.faturamento)}</td>
                      <td className="py-3 text-right text-gray-300">{formatCurrency(p.faturamento / p.vendas)}</td>
                      <td className="py-3 text-right text-gray-400">
                        {((p.faturamento / (data?.totalFaturamento || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
