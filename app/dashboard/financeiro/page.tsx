'use client'
import { useEffect, useState } from 'react'
import KpiCard from '@/components/ui/KpiCard'
import { formatCurrency, formatPercent } from '@/lib/utils'

export default function FinanceiroPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/eduzz/financeiro')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const dre = data?.dre

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Financeiro</h2>
        <p className="text-gray-400 text-sm mt-1">DRE Gerencial + Fluxo de Caixa</p>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPIs do mês */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard title="Receita Bruta (mês)" value={formatCurrency(data?.mes?.bruto ?? 0)} color="green" variation={data?.crescimento} />
            <KpiCard title="Receita Líquida (mês)" value={formatCurrency(data?.mes?.liquido ?? 0)} subtitle="após taxas Eduzz" color="blue" />
            <KpiCard title="Taxas Plataforma" value={formatCurrency(data?.mes?.taxas ?? 0)} subtitle="descontadas pela Eduzz" color="red" />
            <KpiCard title="Saldo Disponível" value={formatCurrency(data?.saldo ?? 0)} subtitle="para saque" color="yellow" />
          </div>

          {/* DRE Gerencial */}
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-base font-bold text-white mb-6">DRE Gerencial — Mês Atual</h3>
            <div className="space-y-0">
              {[
                { label: 'Receita Bruta', value: dre?.receitaBruta, positive: true, bold: false, indent: 0 },
                { label: '(-) Taxas e Deduções', value: -dre?.deducoes, positive: false, bold: false, indent: 1 },
                { label: '(=) Receita Líquida', value: dre?.receitaLiquida, positive: true, bold: true, indent: 0 },
                { label: '(-) Custo por Venda (CPV estimado)', value: -dre?.cpvEstimado, positive: false, bold: false, indent: 1 },
                { label: '(=) Margem Bruta', value: dre?.margemBruta, positive: (dre?.margemBruta ?? 0) > 0, bold: true, indent: 0 },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between py-3 border-b border-gray-800 ${row.bold ? 'bg-gray-800 px-3 rounded-lg my-1' : ''}`}>
                  <span className={`text-sm ${row.indent ? 'pl-4 text-gray-400' : 'text-gray-200'} ${row.bold ? 'font-bold text-white' : ''}`}>
                    {row.label}
                  </span>
                  <span className={`text-sm font-semibold ${row.positive ? 'text-green-400' : 'text-red-400'} ${row.bold ? 'text-base' : ''}`}>
                    {formatCurrency(Math.abs(row.value ?? 0))}
                    {row.value !== undefined && row.value < 0 ? '' : ''}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-400">Margem %</span>
                <span className={`text-sm font-bold ${(dre?.margemPercent ?? 0) > 30 ? 'text-green-400' : (dre?.margemPercent ?? 0) > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {formatPercent(dre?.margemPercent ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Comparativo meses */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Comparativo — Mês Atual vs Anterior</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Faturamento', atual: data?.mes?.bruto, anterior: data?.mesAnterior?.bruto },
                { label: 'Vendas', atual: data?.mes?.quantidade, anterior: data?.mesAnterior?.quantidade, currency: false },
                { label: 'Ticket Médio', atual: (data?.mes?.bruto / (data?.mes?.quantidade || 1)), anterior: (data?.mesAnterior?.bruto / (data?.mesAnterior?.quantidade || 1)) },
              ].map((item, i) => {
                const var_ = item.anterior > 0 ? ((item.atual - item.anterior) / item.anterior) * 100 : 0
                return (
                  <div key={i} className="bg-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-3">{item.label}</p>
                    <p className="text-lg font-bold text-white">
                      {item.currency === false ? item.atual : formatCurrency(item.atual ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Anterior: {item.currency === false ? item.anterior : formatCurrency(item.anterior ?? 0)}
                    </p>
                    <p className={`text-xs font-medium mt-1 ${var_ > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {var_ > 0 ? '+' : ''}{var_.toFixed(1)}%
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
