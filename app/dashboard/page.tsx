'use client'
import { useEffect, useState } from 'react'
import KpiCard from '@/components/ui/KpiCard'
import { formatCurrency } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const [vendas, setVendas] = useState<any>(null)
  const [financeiro, setFinanceiro] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/eduzz/vendas?period=${period}`).then(r => r.json()),
      fetch('/api/eduzz/financeiro').then(r => r.json()),
    ])
      .then(([v, f]) => {
        if (v.error) throw new Error(v.error)
        setVendas(v)
        setFinanceiro(f)
      })
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
          <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
          <p className="text-gray-400 text-sm mt-1">Painel estratégico do seu negócio</p>
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

      {error && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              title="Faturamento"
              value={formatCurrency(vendas?.totalFaturamento ?? 0)}
              subtitle={`${period === '30d' ? 'Últimos 30 dias' : period === '7d' ? 'Últimos 7 dias' : 'Período selecionado'}`}
              variation={financeiro?.crescimento}
              color="green"
            />
            <KpiCard
              title="Total de Vendas"
              value={String(vendas?.totalVendas ?? 0)}
              subtitle="transações no período"
              color="blue"
            />
            <KpiCard
              title="Ticket Médio"
              value={formatCurrency(vendas?.ticketMedio ?? 0)}
              subtitle="por venda"
              color="purple"
            />
            <KpiCard
              title="Saldo Disponível"
              value={formatCurrency(financeiro?.saldo ?? 0)}
              subtitle="na Eduzz agora"
              color="yellow"
            />
          </div>

          {/* Gráfico de faturamento */}
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Faturamento Diário</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={vendas?.graficoDiario ?? []}>
                <defs>
                  <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="data" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => v.substring(5)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(v: any) => [formatCurrency(v), 'Faturamento']}
                />
                <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="url(#gradVendas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top produtos */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Produtos por Faturamento</h3>
            <div className="space-y-3">
              {(vendas?.porProduto ?? []).slice(0, 8).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${((p.faturamento / (vendas?.totalFaturamento || 1)) * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{p.vendas} vendas</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-400">{formatCurrency(p.faturamento)}</span>
                </div>
              ))}
              {(!vendas?.porProduto || vendas.porProduto.length === 0) && (
                <p className="text-sm text-gray-500">Nenhum dado no período</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
