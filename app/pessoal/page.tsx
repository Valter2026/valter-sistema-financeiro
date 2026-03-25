'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, AlertTriangle, Wallet, Plus,
  ArrowDownCircle, Target, Mic, Brain, AlertCircle, Lightbulb,
  CheckCircle, ChevronRight, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import PfTransactionModal from '@/components/pf/PfTransactionModal'
import { DraggableDashboard, DashWidget } from '@/components/ui/DraggableDashboard'
import Link from 'next/link'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const ADVICE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  alert:   { icon: AlertCircle,   color: 'text-red-400',     bg: 'bg-red-950',     border: 'border-red-800'     },
  warning: { icon: AlertTriangle, color: 'text-yellow-400',  bg: 'bg-yellow-950',  border: 'border-yellow-800'  },
  tip:     { icon: Lightbulb,     color: 'text-emerald-400', bg: 'bg-emerald-950', border: 'border-emerald-800' },
  goal:    { icon: Target,        color: 'text-blue-400',    bg: 'bg-blue-950',    border: 'border-blue-800'    },
  success: { icon: CheckCircle,   color: 'text-emerald-300', bg: 'bg-emerald-950', border: 'border-emerald-700' },
}

const CACHE_TTL_MS = 30 * 60 * 1000

export default function PessoalDashboard() {
  const [summary,     setSummary]     = useState<any>(null)
  const [accounts,    setAccounts]    = useState<any[]>([])
  const [cats,        setCats]        = useState<any[]>([])
  const [chart,       setChart]       = useState<any[]>([])
  const [recentTxs,   setRecentTxs]   = useState<any[]>([])
  const [patrimChart, setPatrimChart] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(false)
  const [advices,     setAdvices]     = useState<any[]>([])
  const [adviceAge,   setAdviceAge]   = useState('')
  const [refreshing,  setRefreshing]  = useState(false)
  const year  = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  const loadAdvisorCache = useCallback(async () => {
    try {
      const data = await fetch('/api/pf/advisor/refresh').then(r => r.json())
      setAdvices(Array.isArray(data.advices) ? data.advices.slice(0, 3) : [])
      if (data.generated_at) {
        const age = new Date(data.generated_at)
        setAdviceAge(age.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        if (Date.now() - age.getTime() > CACHE_TTL_MS)
          fetch('/api/pf/advisor/refresh', { method: 'POST' }).then(() => loadAdvisorCache())
      }
    } catch { /* silencioso */ }
  }, [])

  const triggerAdvisorRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetch('/api/pf/advisor/refresh', { method: 'POST' })
      await loadAdvisorCache()
    } finally { setRefreshing(false) }
  }, [loadAdvisorCache])

  const load = useCallback(async () => {
    setLoading(true)
    const d = new Date()
    const start = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
    const end   = d.toISOString().split('T')[0]
    const [s, acc, cat, recent] = await Promise.all([
      fetch(`/api/pf/summary?start=${start}&end=${end}`).then(r => r.json()),
      fetch('/api/pf/accounts').then(r => r.json()),
      fetch('/api/pf/categories').then(r => r.json()),
      fetch('/api/pf/transactions?status=confirmed').then(r => r.json()),
    ])
    setSummary(s)
    setAccounts(Array.isArray(acc) ? acc : [])
    setCats(Array.isArray(cat) ? cat : [])
    setRecentTxs(Array.isArray(recent) ? recent.slice(0, 5) : [])

    const monthlyData = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d2 = new Date(year, month - 1 - (5 - i), 1)
        const m  = String(d2.getMonth()+1).padStart(2,'0')
        const y  = d2.getFullYear()
        return fetch(`/api/pf/summary?start=${y}-${m}-01&end=${y}-${m}-31`)
          .then(r => r.json())
          .then(r => ({
            label:     MONTHS[d2.getMonth()],
            receitas:  r.receitas  ?? 0,
            despesas:  r.despesas  ?? 0,
            resultado: (r.receitas ?? 0) - (r.despesas ?? 0),
            patrimonio: r.totalAtivo ?? 0,
          }))
      })
    )
    setChart(monthlyData)
    let acum = 0
    setPatrimChart(monthlyData.map(m => { acum += m.resultado; return { label: m.label, patrimonio: m.patrimonio || acum } }))
    setLoading(false)
  }, [year, month])

  useEffect(() => { load(); loadAdvisorCache() }, [load, loadAdvisorCache])

  const resultado = summary?.resultado ?? 0
  const positivo  = resultado >= 0
  const activeAccounts = (summary?.accounts ?? []).filter((a: any) => a.active)

  if (loading) return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
      </div>
      {[...Array(4)].map((_,i) => <div key={i} className="h-40 bg-gray-800 rounded-xl animate-pulse" />)}
    </div>
  )

  const widgets: DashWidget[] = [
    {
      id: 'kpis',
      content: (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-950 p-3 md:p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 truncate">Receitas</p>
            <p className="text-sm md:text-lg font-bold text-white tabular-nums truncate">{formatCurrency(summary?.receitas ?? 0)}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1"><TrendingUp size={9} /> do mês</p>
          </div>
          <div className="rounded-xl border-l-4 border-red-500 bg-red-950 p-3 md:p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 truncate">Gastos</p>
            <p className="text-sm md:text-lg font-bold text-white tabular-nums truncate">{formatCurrency(summary?.despesas ?? 0)}</p>
            <p className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1"><TrendingDown size={9} /> do mês</p>
          </div>
          <div className={`rounded-xl border-l-4 p-3 md:p-4 ${positivo ? 'border-blue-500 bg-blue-950' : 'border-red-500 bg-red-950'}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 truncate">Saldo</p>
            <p className={`text-sm md:text-lg font-bold tabular-nums truncate ${positivo ? 'text-white' : 'text-red-400'}`}>{formatCurrency(resultado)}</p>
            <p className={`text-[10px] mt-0.5 ${positivo ? 'text-blue-400' : 'text-red-400'}`}>{positivo ? '▲ sobrou' : '▼ faltou'}</p>
          </div>
          <div className="rounded-xl border-l-4 border-yellow-500 bg-yellow-950 p-3 md:p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 truncate">Patrimônio</p>
            <p className={`text-sm md:text-lg font-bold tabular-nums truncate ${(summary?.totalAtivo ?? 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(summary?.totalAtivo ?? 0)}
            </p>
            <p className="text-[10px] text-yellow-400 mt-0.5 flex items-center gap-1"><Wallet size={9} /> em contas</p>
          </div>
        </div>
      ),
    },
    {
      id: 'advisor',
      visible: advices.length > 0 || refreshing,
      content: (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Consultor IA</span>
              {adviceAge && <span className="text-[10px] text-gray-600">· {adviceAge}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={triggerAdvisorRefresh} disabled={refreshing}
                className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40">
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <Link href="/pessoal/consultor" className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5">
                Ver tudo <ChevronRight size={10} />
              </Link>
            </div>
          </div>
          {refreshing && advices.length === 0 ? (
            <div className="px-4 py-4 flex items-center gap-2 text-gray-400 text-xs">
              <RefreshCw size={12} className="animate-spin" /> Consultando...
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {advices.map((adv: any, i: number) => {
                const cfg  = ADVICE_CONFIG[adv.type] ?? ADVICE_CONFIG.tip
                const Icon = cfg.icon
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={12} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{adv.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{adv.message}</p>
                      {adv.action && <p className="text-[10px] text-emerald-400 mt-1">→ {adv.action}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'alerts',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(summary?.qtdVencidos ?? 0) > 0 ? (
            <div className="rounded-xl border border-red-800 bg-red-950 p-3 md:p-4 flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-bold text-red-300 truncate">{summary.qtdVencidos} conta(s) vencida(s)</p>
                <p className="text-[10px] text-red-400">{formatCurrency(summary.totalVencido)} em atraso</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-800 bg-emerald-950 p-3 md:p-4 flex items-center gap-3">
              <TrendingUp size={16} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs md:text-sm text-emerald-300 font-medium">Nenhuma conta vencida!</p>
            </div>
          )}
          <div className="rounded-xl border-l-4 border-orange-500 bg-orange-950 p-3 md:p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 truncate">A Pagar</p>
            <p className="text-sm md:text-lg font-bold text-white tabular-nums truncate">{formatCurrency(summary?.aPagar ?? 0)}</p>
            <p className="text-[10px] text-orange-400 mt-0.5 flex items-center gap-1"><ArrowDownCircle size={9} /> pendente</p>
          </div>
        </div>
      ),
    },
    {
      id: 'accounts',
      visible: activeAccounts.length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Saldo por Conta</h3>
          <div className="grid grid-cols-2 gap-2">
            {activeAccounts.map((acc: any) => (
              <div key={acc.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: acc.color ?? '#10b981' }} />
                  <span className="text-[10px] text-gray-400 font-medium truncate">{acc.name}</span>
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
      id: 'goals',
      visible: (summary?.goals ?? []).length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-emerald-400" />
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Metas</h3>
          </div>
          <div className="space-y-3">
            {(summary?.goals ?? []).map((g: any) => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs md:text-sm text-gray-200 flex items-center gap-1.5 truncate">
                      <span>{g.icon}</span><span className="truncate">{g.name}</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex-shrink-0 ml-2">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: g.color ?? '#10b981' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                    <span className="tabular-nums">{formatCurrency(g.current_amount)}</span>
                    <span className="tabular-nums">{formatCurrency(g.target_amount)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ),
    },
    {
      id: 'chart-bar',
      visible: chart.length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={30} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any, n: any) => [formatCurrency(v), n === 'receitas' ? 'Receitas' : 'Gastos']} />
              <Bar dataKey="receitas" fill="#10b981" radius={[3,3,0,0]} name="receitas" />
              <Bar dataKey="despesas" fill="#ef4444" radius={[3,3,0,0]} name="despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: 'chart-resultado',
      visible: chart.length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sobra / Falta por Mês</h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="gResPF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={30} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [formatCurrency(v), 'Resultado']} />
              <Area type="monotone" dataKey="resultado" stroke="#10b981" fill="url(#gResPF)" strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  return <circle key={cx} cx={cx} cy={cy} r={3} fill={payload.resultado >= 0 ? '#10b981' : '#ef4444'} stroke="#111827" strokeWidth={2} />
                }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: 'chart-patrim',
      visible: patrimChart.some(p => p.patrimonio !== 0),
      content: (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Evolução Patrimonial</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={patrimChart}>
              <defs>
                <linearGradient id="gPatrimPF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={30} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [formatCurrency(v), 'Patrimônio']} />
              <Area type="monotone" dataKey="patrimonio" stroke="#f59e0b" fill="url(#gPatrimPF)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: 'recent',
      visible: recentTxs.length > 0,
      content: (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Últimos Lançamentos</h3>
            <a href="/pessoal/lancamentos" className="text-xs text-emerald-400 hover:text-emerald-300">Ver todos →</a>
          </div>
          <div className="divide-y divide-gray-800">
            {recentTxs.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-950' : 'bg-red-950'}`}>
                  {tx.type === 'income'
                    ? <TrendingUp size={13} className="text-emerald-400" />
                    : <TrendingDown size={13} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-200 truncate">{tx.description || tx.category?.name || '—'}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    {tx.category && ` · ${tx.category.icon ?? ''} ${tx.category.name}`}
                  </p>
                </div>
                <p className={`text-xs font-bold flex-shrink-0 tabular-nums ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '−'}{formatCurrency(Number(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Minhas Finanças</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-700 transition-colors">
            <Mic size={13} /> Voz
          </button>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors">
            <Plus size={14} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <DraggableDashboard storageKey="pf-dashboard-order" widgets={widgets} />

      <PfTransactionModal
        open={modal}
        onClose={() => setModal(false)}
        onSaved={() => { load(); triggerAdvisorRefresh() }}
        accounts={accounts}
        categories={cats}
      />
    </div>
  )
}
