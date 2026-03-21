'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertTriangle, Wallet, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import TransactionModal from '@/components/fin/TransactionModal'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const currentMonth = () => {
  const d = new Date()
  return { start: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`, end: d.toISOString().split('T')[0] }
}

export default function FinancasDashboard() {
  const [summary,   setSummary]   = useState<any>(null)
  const [cashflow,  setCashflow]  = useState<any>(null)
  const [accounts,  setAccounts]  = useState<any[]>([])
  const [categories,setCategories]= useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
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

  useEffect(() => { load() }, [load])

  const resultado = summary?.resultado ?? 0
  const positivo  = resultado >= 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h2>
          <p className="text-gray-400 text-sm mt-1">Visão geral do mês atual</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_,i)=>(
          <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
        ))}</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Receitas</p>
                <div className="p-2 bg-green-50 rounded-lg"><TrendingUp size={16} className="text-green-600" /></div>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.receitas ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">mês atual</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Despesas</p>
                <div className="p-2 bg-red-50 rounded-lg"><TrendingDown size={16} className="text-red-500" /></div>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(summary?.despesas ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-1">mês atual</p>
            </div>

            <div className={`rounded-2xl p-5 border shadow-sm ${positivo ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resultado</p>
                <div className={`p-2 rounded-lg ${positivo ? 'bg-green-100' : 'bg-red-100'}`}>
                  {positivo ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                </div>
              </div>
              <p className={`text-2xl font-bold ${positivo ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(resultado)}</p>
              <p className="text-xs text-gray-400 mt-1">{positivo ? 'superávit' : 'déficit'}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Patrimônio</p>
                <div className="p-2 bg-blue-50 rounded-lg"><Wallet size={16} className="text-blue-600" /></div>
              </div>
              <p className={`text-2xl font-bold ${(summary?.totalAtivo ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(summary?.totalAtivo ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">saldo total contas</p>
            </div>
          </div>

          {/* A pagar / Receber */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle size={15} className="text-orange-500" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">A Pagar</p>
              </div>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(summary?.aPagar ?? 0)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle size={15} className="text-blue-500" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">A Receber</p>
              </div>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(summary?.aReceber ?? 0)}</p>
            </div>
            {(summary?.qtdVencidos ?? 0) > 0 && (
              <div className="col-span-2 bg-red-50 rounded-2xl p-5 border border-red-100 flex items-center gap-3">
                <AlertTriangle size={22} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">{summary.qtdVencidos} conta(s) vencida(s)</p>
                  <p className="text-xs text-red-500">{formatCurrency(summary.totalVencido)} em atraso</p>
                </div>
              </div>
            )}
          </div>

          {/* Contas */}
          {accounts.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Saldo por Conta</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(summary?.accounts ?? []).filter((a:any) => a.active).map((acc: any) => (
                  <div key={acc.id} className="rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: acc.color ?? '#3b82f6' }} />
                      <span className="text-xs text-gray-500 font-medium truncate">{acc.name}</span>
                    </div>
                    <p className={`text-lg font-bold ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      {formatCurrency(acc.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico fluxo de caixa */}
          {cashflow?.fluxo && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Fluxo de Caixa {year}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cashflow.fluxo} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, n: any) => [formatCurrency(v), n === 'receitas' ? 'Receitas' : 'Despesas']}
                  />
                  <Legend formatter={v => v === 'receitas' ? 'Receitas' : 'Despesas'} />
                  <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} name="receitas" />
                  <Bar dataKey="despesas" fill="#f87171" radius={[4, 4, 0, 0]} name="despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Evolução do saldo */}
          {cashflow?.fluxo && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Evolução do Saldo {year}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cashflow.fluxo}>
                  <defs>
                    <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => [formatCurrency(v), 'Saldo']}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="url(#gSaldo)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      <TransactionModal
        open={modal}
        onClose={() => setModal(false)}
        onSaved={load}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
