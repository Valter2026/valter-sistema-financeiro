'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, AlertTriangle, Wallet, Plus,
  ArrowDownCircle, Target, Mic
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import PfTransactionModal from '@/components/pf/PfTransactionModal'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function PessoalDashboard() {
  const [summary,  setSummary]  = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [cats,     setCats]     = useState<any[]>([])
  const [chart,    setChart]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const year  = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  const load = useCallback(async () => {
    setLoading(true)
    const d = new Date()
    const start = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
    const end   = d.toISOString().split('T')[0]

    const [s, acc, cat] = await Promise.all([
      fetch(`/api/pf/summary?start=${start}&end=${end}`).then(r => r.json()),
      fetch('/api/pf/accounts').then(r => r.json()),
      fetch('/api/pf/categories').then(r => r.json()),
    ])
    setSummary(s)
    setAccounts(Array.isArray(acc) ? acc : [])
    setCats(Array.isArray(cat) ? cat : [])

    // Monta gráfico dos últimos 6 meses
    const chartData = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d2 = new Date(year, month - 1 - (5 - i), 1)
        const m  = String(d2.getMonth()+1).padStart(2,'0')
        const y  = d2.getFullYear()
        return fetch(`/api/pf/summary?start=${y}-${m}-01&end=${y}-${m}-31`)
          .then(r => r.json())
          .then(r => ({ label: MONTHS[d2.getMonth()], receitas: r.receitas ?? 0, despesas: r.despesas ?? 0, resultado: (r.receitas ?? 0) - (r.despesas ?? 0) }))
      })
    )
    setChart(chartData)
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const resultado = summary?.resultado ?? 0
  const positivo  = resultado >= 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Minhas Finanças</h2>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 hover:text-white transition-colors">
            <Mic size={15} /> Por Voz
          </button>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_,i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Receitas do Mês</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary?.receitas ?? 0)}</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp size={11} /> confirmadas</p>
            </div>
            <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Gastos do Mês</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary?.despesas ?? 0)}</p>
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><TrendingDown size={11} /> confirmados</p>
            </div>
            <div className={`rounded-xl border-l-4 p-5 ${positivo ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saldo do Mês</p>
              <p className={`text-2xl font-bold ${positivo ? 'text-white' : 'text-red-400'}`}>{formatCurrency(resultado)}</p>
              <p className={`text-xs mt-1 ${positivo ? 'text-blue-400' : 'text-red-400'}`}>{positivo ? '▲ sobrou' : '▼ gastou mais'}</p>
            </div>
            <div className="rounded-xl border-l-4 border-yellow-500 bg-yellow-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Patrimônio</p>
              <p className={`text-2xl font-bold ${(summary?.totalAtivo ?? 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(summary?.totalAtivo ?? 0)}
              </p>
              <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1"><Wallet size={11} /> total em contas</p>
            </div>
          </div>

          {/* Alertas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(summary?.qtdVencidos ?? 0) > 0 ? (
              <div className="rounded-xl border border-red-800 bg-red-950 p-5 flex items-center gap-4">
                <AlertTriangle size={22} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-300">{summary.qtdVencidos} conta(s) vencida(s)</p>
                  <p className="text-xs text-red-400 mt-0.5">{formatCurrency(summary.totalVencido)} em atraso</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-800 bg-emerald-950 p-5 flex items-center gap-3">
                <TrendingUp size={18} className="text-emerald-400" />
                <p className="text-sm text-emerald-300 font-medium">Nenhuma conta vencida!</p>
              </div>
            )}
            <div className="rounded-xl border-l-4 border-orange-500 bg-orange-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">A Pagar</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary?.aPagar ?? 0)}</p>
              <p className="text-xs text-orange-400 mt-1 flex items-center gap-1"><ArrowDownCircle size={11} /> em aberto</p>
            </div>
          </div>

          {/* Saldo por conta */}
          {(summary?.accounts ?? []).filter((a: any) => a.active).length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Saldo por Conta</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(summary?.accounts ?? []).filter((a: any) => a.active).map((acc: any) => (
                  <div key={acc.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: acc.color ?? '#10b981' }} />
                      <span className="text-xs text-gray-400 font-medium truncate">{acc.name}</span>
                    </div>
                    <p className={`text-lg font-bold ${acc.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                      {formatCurrency(acc.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metas ativas */}
          {(summary?.goals ?? []).length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={15} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-gray-300">Minhas Metas</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(summary.goals as any[]).map((g: any) => {
                  const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
                  return (
                    <div key={g.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{g.icon}</span>
                          <span className="text-sm font-semibold text-gray-200">{g.name}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: g.color ?? '#10b981' }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatCurrency(g.current_amount)}</span>
                        <span>{formatCurrency(g.target_amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Gráfico 6 meses */}
          {chart.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Receitas × Gastos — últimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chart} barSize={20}>
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
          )}

          {/* Evolução do resultado */}
          {chart.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Sobra/Falta por Mês</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="resultado" stroke="#10b981" fill="url(#gRes)" strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props
                      return <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.resultado >= 0 ? '#10b981' : '#ef4444'} stroke="#111827" strokeWidth={2} />
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      <PfTransactionModal
        open={modal}
        onClose={() => setModal(false)}
        onSaved={load}
        accounts={accounts}
        categories={cats}
      />
    </div>
  )
}
