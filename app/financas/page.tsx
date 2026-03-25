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
import { DraggableDashboard, DashWidget } from '@/components/ui/DraggableDashboard'
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
  alert: AlertTriangle, warning: AlertTriangle,
  tip: Lightbulb, goal: Target, success: CheckCircle,
}
const ADVICE_COLOR: Record<string, string> = {
  alert:   'text-red-400 bg-red-950 border-red-800',
  warning: 'text-yellow-400 bg-yellow-950 border-yellow-800',
  tip:     'text-blue-400 bg-gray-900 border-blue-800',
  goal:    'text-blue-400 bg-blue-950 border-blue-800',
  success: 'text-emerald-400 bg-emerald-950 border-emerald-800',
}
const CACHE_MAX_AGE_MS = 30 * 60 * 1000

// KPI card reutilizável
function K({ label, value, sub, subIcon, bc, bg, vc, sc }: {
  label: string; value: string; sub?: React.ReactNode; subIcon?: React.ReactNode
  bc: string; bg: string; vc?: string; sc?: string
}) {
  return (
    <div className={`rounded-xl border-l-4 ${bc} ${bg} p-3 md:p-5`}>
      <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">{label}</p>
      <p className={`text-sm md:text-xl font-bold tabular-nums truncate ${vc ?? 'text-white'}`}>{value}</p>
      {sub && (
        <p className={`text-[10px] mt-1 flex items-center gap-1 ${sc ?? 'text-gray-400'}`}>
          {subIcon}{sub}
        </p>
      )}
    </div>
  )
}

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
      if (res.generated_at) {
        const age = Date.now() - new Date(res.generated_at).getTime()
        if (age > CACHE_MAX_AGE_MS) fetch('/api/fin/advisor/refresh', { method: 'POST' })
      }
    }
  }, [])

  const triggerAdvisorRefresh = () =>
    setTimeout(() => fetch('/api/fin/advisor/refresh', { method: 'POST' }), 2000)

  useEffect(() => { load(); loadAdvisor() }, [load, loadAdvisor])

  const resultado = summary?.resultado ?? 0
  const positivo  = resultado >= 0
  const fluxo     = cashflow?.fluxo ?? []
  const activeAccounts = (summary?.accounts ?? []).filter((a: any) => a.active)

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_,i) => <div key={i} className="h-20 md:h-24 bg-gray-800 rounded-xl animate-pulse" />)}
      </div>
      {[...Array(3)].map((_,i) => <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse" />)}
    </div>
  )

  const widgets: DashWidget[] = [
    {
      id: 'kpis',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <K label="Receitas do Mês"  value={formatCurrency(summary?.receitas ?? 0)}   bc="border-green-500"  bg="bg-green-950"  sub="confirmadas"  subIcon={<TrendingUp size={9}/>}   sc="text-green-400" />
            <K label="Despesas do Mês"  value={formatCurrency(summary?.despesas ?? 0)}   bc="border-red-500"    bg="bg-red-950"    sub="confirmadas"  subIcon={<TrendingDown size={9}/>} sc="text-red-400" />
            <K label="Resultado"        value={formatCurrency(resultado)}                 bc={positivo ? 'border-blue-500' : 'border-red-500'} bg={positivo ? 'bg-blue-950' : 'bg-red-950'} vc={positivo ? 'text-white' : 'text-red-400'} sub={positivo ? '▲ superávit' : '▼ déficit'} sc={positivo ? 'text-blue-400' : 'text-red-400'} />
            <K label="Patrimônio Total" value={formatCurrency(summary?.totalAtivo ?? 0)} bc="border-yellow-500" bg="bg-yellow-950" vc={(summary?.totalAtivo ?? 0) >= 0 ? 'text-white' : 'text-red-400'} sub="saldo em contas" subIcon={<Wallet size={9}/>} sc="text-yellow-400" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <K label="A Pagar"   value={formatCurrency(summary?.aPagar ?? 0)}   bc="border-orange-500" bg="bg-orange-950" sub="em aberto" subIcon={<ArrowDownCircle size={9}/>} sc="text-orange-400" />
            <K label="A Receber" value={formatCurrency(summary?.aReceber ?? 0)} bc="border-blue-500"   bg="bg-blue-950"   sub="em aberto" subIcon={<ArrowUpCircle size={9}/>}   sc="text-blue-400" />
            {(summary?.qtdVencidos ?? 0) > 0 ? (
              <div className="col-span-2 rounded-xl border border-red-800 bg-red-950 p-3 md:p-5 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-bold text-red-300 truncate">{summary.qtdVencidos} conta(s) vencida(s)</p>
                  <p className="text-[10px] text-red-400 truncate">{formatCurrency(summary.totalVencido)} em atraso</p>
                </div>
              </div>
            ) : (
              <div className="col-span-2 rounded-xl border border-green-800 bg-green-950 p-3 md:p-5 flex items-center gap-3">
                <TrendingUp size={16} className="text-green-400 flex-shrink-0" />
                <p className="text-xs md:text-sm text-green-300 font-medium">Nenhuma conta vencida</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'advisor',
      visible: advices.length > 0,
      content: (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Brain size={14} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Consultor Empresarial IA</h3>
            </div>
            <Link href="/financas/consultor" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              Ver tudo <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {advices.map((a: any, i: number) => {
              const Icon  = ADVICE_ICON[a.type] ?? Lightbulb
              const color = ADVICE_COLOR[a.type] ?? ADVICE_COLOR.tip
              return (
                <div key={i} className={`rounded-xl border p-3 md:p-4 ${color}`}>
                  <div className="flex items-start gap-3">
                    <Icon size={15} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-bold text-white mb-1 truncate">{a.title}</p>
                      <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">{a.message}</p>
                      {a.action && <p className="text-[10px] text-gray-400 mt-1 font-medium">→ {a.action}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ),
    },
    {
      id: 'accounts',
      visible: activeAccounts.length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Saldo por Conta</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            {activeAccounts.map((acc: any) => (
              <div key={acc.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: acc.color ?? '#3b82f6' }} />
                  <span className="text-[10px] md:text-xs text-gray-400 font-medium truncate">{acc.name}</span>
                </div>
                <p className={`text-xs md:text-sm font-bold tabular-nums truncate ${acc.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'chart-bar',
      visible: fluxo.length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Receitas × Despesas — {year}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fluxo} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={38} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any, n: any) => [formatCurrency(v), n === 'receitas' ? 'Receitas' : 'Despesas']} />
              <Legend formatter={v => v === 'receitas' ? 'Receitas' : 'Despesas'} />
              <Bar dataKey="receitas" fill="#10b981" radius={[4,4,0,0]} name="receitas" />
              <Bar dataKey="despesas" fill="#ef4444" radius={[4,4,0,0]} name="despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: 'chart-area',
      visible: fluxo.length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Evolução do Saldo — {year}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={fluxo}>
              <defs>
                <linearGradient id="gSaldoFin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={38} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [formatCurrency(v), 'Saldo']} />
              <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="url(#gSaldoFin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Dashboard Financeiro</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={15} /> <span className="hidden sm:inline">Novo Lançamento</span><span className="sm:hidden">Novo</span>
        </button>
      </div>

      <DraggableDashboard storageKey="fin-dashboard-order" widgets={widgets} />

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
