'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#06b6d4','#ec4899']

export default function BalancoPage() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/pf/balanco').then(r => r.json())
    setData(res)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const positivo = (data?.patrimonioLiquido ?? 0) >= 0

  const pieAtivos = (data?.ativos ?? []).map((g: any) => ({ name: g.label, value: Math.max(0, g.total) })).filter((d: any) => d.value > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Balanço Patrimonial</h2>
          <p className="text-gray-400 text-sm mt-1">Ativos, passivos e patrimônio líquido</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 transition-colors">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-32 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}</div>
      ) : (
        <>
          {/* Resumo patrimonial */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Ativos</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data?.totalAtivos ?? 0)}</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp size={11} /> Recursos disponíveis</p>
            </div>
            <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Passivos</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data?.totalPassivos ?? 0)}</p>
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><TrendingDown size={11} /> Dívidas e obrigações</p>
            </div>
            <div className={`rounded-xl border-l-4 p-5 ${positivo ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Patrimônio Líquido</p>
              <p className={`text-2xl font-bold ${positivo ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(data?.patrimonioLiquido ?? 0)}
              </p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${positivo ? 'text-blue-400' : 'text-red-400'}`}>
                <Wallet size={11} /> {positivo ? 'Saldo positivo' : 'Passivos superam ativos'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Gráfico pizza ativos */}
            {pieAtivos.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Distribuição dos Ativos</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieAtivos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {pieAtivos.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [formatCurrency(v)]}
                    />
                    <Legend formatter={v => v} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Equação patrimonial */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-gray-300 mb-5">Equação Patrimonial</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-emerald-950 border border-emerald-900 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-300">Ativos totais</span>
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(data?.totalAtivos ?? 0)}</span>
                </div>
                <div className="text-center text-gray-600 text-sm">−</div>
                <div className="flex items-center justify-between bg-red-950 border border-red-900 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-300">Passivos totais</span>
                  <span className="text-sm font-bold text-red-400">{formatCurrency(data?.totalPassivos ?? 0)}</span>
                </div>
                <div className="text-center text-gray-600 text-sm">=</div>
                <div className={`flex items-center justify-between border rounded-xl px-4 py-3 ${positivo ? 'bg-blue-950 border-blue-900' : 'bg-red-950 border-red-900'}`}>
                  <span className="text-sm text-gray-300 font-semibold">Patrimônio Líquido</span>
                  <span className={`text-lg font-bold ${positivo ? 'text-blue-300' : 'text-red-400'}`}>{formatCurrency(data?.patrimonioLiquido ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ativos por grupo */}
          {(data?.ativos ?? []).length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-4">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300">Ativos — Detalhamento</h3>
              </div>
              {(data.ativos as any[]).map((grupo: any, gi: number) => (
                <div key={gi}>
                  <div className="px-5 py-2.5 bg-gray-800/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{grupo.label}</span>
                    <span className="text-xs font-bold text-emerald-400">{formatCurrency(grupo.total)}</span>
                  </div>
                  {grupo.items.map((acc: any) => (
                    <div key={acc.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: acc.color ?? '#10b981' }} />
                      <span className="flex-1 text-sm text-gray-300">{acc.name}</span>
                      <span className={`text-sm font-bold ${acc.balance >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Passivos */}
          {(data?.passivos ?? []).length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Passivos — Cartões de Crédito</h3>
                <span className="text-xs font-bold text-red-400">{formatCurrency(data.totalPassivos)}</span>
              </div>
              {(data.passivos as any[]).map((acc: any) => (
                <div key={acc.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: acc.color ?? '#ef4444' }} />
                  <span className="flex-1 text-sm text-gray-300">{acc.name}</span>
                  <span className="text-sm font-bold text-red-400">{formatCurrency(Math.max(0, -acc.balance))}</span>
                </div>
              ))}
            </div>
          )}

          {(data?.ativos ?? []).length === 0 && (data?.passivos ?? []).length === 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 py-16 text-center">
              <Wallet size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma conta cadastrada ainda.</p>
              <a href="/pessoal/contas" className="mt-2 inline-block text-xs text-emerald-400 hover:underline">Cadastrar contas →</a>
            </div>
          )}
        </>
      )}
    </div>
  )
}
