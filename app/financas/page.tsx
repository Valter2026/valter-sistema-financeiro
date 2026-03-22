'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, AlertTriangle, Wallet, Plus,
  ArrowUpCircle, ArrowDownCircle, Brain, ChevronRight,
  Lightbulb, Target, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import FinTransactionModal from '@/components/fin/FinTransactionModal'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const currentMonth = () => {
  const d = new Date()
  return {
    start: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,
    end: d.toISOString().split('T')[0],
  }
}

const ADVICE_ICON: Record<string, any> = {
  alert:   AlertTriangle,
  warning: AlertTriangle,
  tip:     Lightbulb,
  goal:    Target,
  success: CheckCircle,
}
const ADVICE_COLOR: Record<string, string> = {
  alert:   'text-red-400 bg-red-950 border-red-800',
  warning: 'text-yellow-400 bg-yellow-950 border-yellow-800',
  tip:     'text-blue-400 bg-gray-900 border-blue-800',
  goal:    'text-blue-400 bg-blue-950 border-blue-800',
  success: 'text-emerald-400 bg-emerald-950 border-emerald-800',
}

const CACHE_MAX_AGE_MS = 30 * 60 * 1000 // 30 min

export default function FinancasDashboard() {
  const [summary,    setSummary]    = useState<any>(null)
  const [cashflow,   setCashflow]   = useState<any>(null)
  const [accounts,   setAccounts]   = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [advices,    setAdvices]    = useState<any[]>([])
  const year = new Date().getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    const { start, end } = currentMonth()
    const [s, c, acc, cat] = await Promise.all([
      fetch(`/api/fin/summary?start=${start}&end=${end}`).then(r => r.json()),
      fetch(`/api/fin/cashflow?year=${year}`).then(r => r.json()),
      fetch('/api/fin/accounts').then(r => r.json()),
      fetch('/api/fin/categories').then(r => r.json()),
    ])
    setSummary(s); setCashflow(c)
    setAccounts(Array.isArray(acc) ? acc : [])
    setCategories(Array.isArray(cat) ? cat : [])
    setLoading(false)
  }, [year])

  const loadAdvisor = useCallback(async () => {
    const res = await fetch('/api/fin/advisor/refresh').then(r => r.json())
    if (Array.isArray(res.advices) && res.advices.length > 0) {
      setAdvices(res.advices.slice(0, 3))
      // Se cache muito antigo, dispara refresh em background
      if (res.generated_at) {
        const age = Date.now() - new Date(res.generated_at).getTime()
        if (age > CACHE_MAX_AGE_MS) {
          fetch('/api/fin/advisor/refresh', { method: 'POST' })
        }
      }
    }
  }, [])

  const triggerAdvisorRefresh = () => {
    setTimeout(() => fetch('/api/fin/advisor/refresh', { method: 'POST' }), 2000)
  }

  useEffect(() => { load(); loadAdvisor() }, [load, loadAdvisor])

  const resultado = summary?.resultado ?? 0
  const positivo  = resultado >= 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
          <p className="text-gray-400 text-sm mt-1">Visão geral · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg">
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_,i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPIs linha 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="rounded-xl border-l-4 border-green-500 bg-green-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Receitas do Mês</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary?.receitas ?? 0)}</p>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><TrendingUp size={11} /> confirmadas</p>
            </div>
            <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Despesas do Mês</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary?.despesas ?? 0)}</p>
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><TrendingDown size={11} /> confirmadas</p>
            </div>
            <div className={`rounded-xl border-l-4 p-5 ${positivo ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resultado</p>
              <p className={`text-2xl font-bold ${positivo ? 'text-white' : 'text-red-400'}`}>{formatCurrency(resultado)}</p>
              <p className={`text-xs mt-1 ${positivo ? 'text-blue-400' : 'text-red-400'}`}>{positivo ? '▲ superávit' : '▼ déficit'}</p>
            </div>
            <div className="rounded-xl border-l-4 border-yellow-500 bg-yellow-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Patrimônio Total</p>
              <p className={`text-2xl font-bold ${(summary?.totalAtivo ?? 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(summary?.totalAtivo ?? 0)}
              </p>
              <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1"><Wallet size={11} /> saldo em contas</p>
            </div>
          </div>

          {/* KPIs linha 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border-l-4 border-orange-500 bg-orange-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">A Pagar</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary?.aPagar ?? 0)}</p>
              <p className="text-xs text-orange-400 mt-1 flex items-center gap-1"><ArrowDownCircle size={11} /> em aberto</p>
            </div>
            <div className="rounded-xl border-l-4 border-blue-500 bg-blue-950 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">A Receber</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary?.aReceber ?? 0)}</p>
              <p className="text-xs text-blue-400 mt-1 flex items-center gap-1"><ArrowUpCircle size={11} /> em aberto</p>
            </div>
            {(summary?.qtdVencidos ?? 0) > 0 ? (
              <div className="col-span-2 rounded-xl border border-red-800 bg-red-950 p-5 flex items-center gap-4">
                <AlertTriangle size={24} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-300">{summary.qtdVencidos} conta(s) vencida(s)</p>
                  <p className="text-xs text-red-400 mt-0.5">{formatCurrency(summary.totalVencido)} em atraso — atenção imediata</p>
                </div>
              </div>
            ) : (
              <div className="col-span-2 rounded-xl border border-green-800 bg-green-950 p-5 flex items-center gap-3">
                <TrendingUp size={20} className="text-green-400" />
                <p className="text-sm text-green-300 font-medium">Nenhuma conta vencida em aberto</p>
              </div>
            )}
          </div>

          {/* Widget Consultor IA */}
          {advices.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Brain size={14} className="text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Consultor Empresarial IA</h3>
                </div>
                <Link href="/financas/consultor"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Ver tudo <ChevronRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {advices.map((a: any, i: number) => {
                  const Icon  = ADVICE_ICON[a.type]  ?? Lightbulb
                  const color = ADVICE_COLOR[a.type] ?? ADVICE_COLOR.tip
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${color}`}>
                      <div className="flex items-start gap-3">
                        <Icon size={16} className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white mb-1">{a.title}</p>
                          <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{a.message}</p>
                          {a.action && <p className="text-xs text-gray-400 mt-1.5 font-medium">→ {a.action}</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Saldo por conta */}
          {(summary?.accounts ?? []).filter((a:any) => a.active).length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Saldo por Conta</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(summary?.accounts ?? []).filter((a:any) => a.active).map((acc: any) => (
                  <div key={acc.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: acc.color ?? '#3b82f6' }} />
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

          {/* Gráfico receitas x despesas */}
          {(cashflow?.fluxo ?? []).length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Receitas × Despesas — {year}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cashflow.fluxo} barSize={18}>
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
          )}

          {/* Evolução do saldo */}
          {(cashflow?.fluxo ?? []).length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Evolução do Saldo — {year}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cashflow.fluxo}>
                  <defs>
                    <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [formatCurrency(v), 'Saldo']}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="url(#gSaldo)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      <FinTransactionModal
        open={modal}
        onClose={() => setModal(false)}
        onSaved={() => { load(); triggerAdvisorRefresh() }}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
