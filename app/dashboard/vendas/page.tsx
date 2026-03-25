'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import KpiCard from '@/components/ui/KpiCard'
import FilterBar, { FilterState, filterToParams, filterLabel } from '@/components/ui/FilterBar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Legend
} from 'recharts'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function mesLabel(mes: string) {
  const [y, m] = mes.split('-')
  return `${MESES_LABEL[parseInt(m)-1]}/${y.slice(2)}`
}

export default function VendasPage() {
  const [data,    setData]    = useState<any>(null)
  const [fin,     setFin]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string|null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync,setLastSync]= useState('')
  const [filter,  setFilter]  = useState<FilterState>({ type: 'year', year: 2026 })
  const [view,    setView]    = useState<'mensal'|'diario'>('mensal')

  const load = useCallback((f: FilterState) => {
    setLoading(true); setError(null)
    const p  = filterToParams(f)
    const qs = new URLSearchParams(p as any).toString()
    Promise.all([
      fetch(`/api/eduzz/vendas?${qs}`).then(r => r.json()),
      fetch('/api/eduzz/financeiro').then(r => r.json()),
    ]).then(([v, fi]) => {
      if (v.error) throw new Error(v.error)
      setData(v); if (!fi.error) setFin(fi)
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/sync')
      setLastSync(new Date().toLocaleTimeString('pt-BR'))
      load(filter)
    } finally { setSyncing(false) }
  }

  const grafico = view === 'mensal'
    ? (data?.graficoMensal ?? []).map((d: any) => ({ ...d, label: mesLabel(d.mes) }))
    : data?.graficoDiario ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Vendas</h2>
          <p className="text-gray-400 text-sm mt-1">
            {data ? `${data.totalRegistros} registros · ${data.quantidade} pagas · ${filterLabel(filter)}` : 'Carregando...'}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <FilterBar value={filter} onChange={f => { setFilter(f); load(f) }} onSync={handleSync} syncing={syncing} lastSync={lastSync} />
      </div>

      {error && <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">Erro: {error}</div>}

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_,i)=><div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse"/>)}</div>
      ) : (
        <>
          {/* KPIs linha 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard title="Faturamento Bruto"   value={formatCurrency(data?.bruto ?? 0)}      color="green" variation={fin?.crescimentoBruto} />
            <KpiCard title="Faturamento Líquido" value={formatCurrency(data?.liquido ?? 0)}    color="blue"  subtitle="após taxas" />
            <KpiCard title="Taxas Totais"        value={formatCurrency(data?.totalTaxas ?? 0)} color="red"
              subtitle={`Plat: ${formatCurrency(data?.taxaPlat??0)} · COOP: ${formatCurrency(data?.taxaCoop??0)}`} />
            <KpiCard title="Saldo Disponível"    value={formatCurrency(fin?.saldo ?? 0)}       color="yellow"
              subtitle="disponível para saque agora"
              extraLabel="⚡ Antecipável" extraValue={formatCurrency(fin?.saldoFuturo ?? 0)} extraColor="amber" />
          </div>

          {/* KPIs linha 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard title="Vendas Pagas"     value={String(data?.quantidade ?? 0)} color="blue" />
            <KpiCard title="Ticket Médio"     value={formatCurrency(data?.ticketMedio ?? 0)} color="purple" />
            <KpiCard title="Margem Líquida"   value={`${data?.bruto > 0 ? ((data.liquido/data.bruto)*100).toFixed(1) : 0}%`} color="purple" />
            <KpiCard title="Produtos Vendidos" value={String(data?.porProduto?.length ?? 0)} color="green" subtitle="produtos distintos" />
          </div>

          {/* Reembolsos */}
          {(data?.reembolsos?.qtd ?? 0) > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <KpiCard title="Reembolsos (R$)"     value={formatCurrency(data.reembolsos.valor)} color="red" subtitle={`${data.reembolsos.qtd} transação(ões)`} />
              <KpiCard title="% Reemb / Bruto"     value={`${data.reembolsos.pctBruto}%`}        color="red" />
              <KpiCard title="% Reemb / Líquido"   value={`${data.reembolsos.pctLiq}%`}          color="red" />
              <KpiCard title="Líq. após reembolsos" value={formatCurrency((data.liquido??0)-(data.reembolsos.valor??0))} color="blue" />
            </div>
          )}

          {/* Gráfico */}
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Evolução — {filterLabel(filter)}</h3>
              <div className="flex gap-2">
                {(['mensal','diario'] as const).map(v=>(
                  <button key={v} onClick={()=>setView(v)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${view===v?'bg-gray-700 text-white':'text-gray-500 hover:text-gray-300'}`}>
                    {v==='mensal'?'Mensal':'Diário'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={grafico}>
                <defs>
                  <linearGradient id="gB2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gL2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey={view==='mensal'?'label':'data'} tick={{fill:'#6b7280',fontSize:11}}
                  tickFormatter={v=>view==='diario'?v.substring(5):v}/>
                <YAxis tick={{fill:'#6b7280',fontSize:11}} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}}
                  formatter={(v:any,n:any)=>[formatCurrency(v),n==='bruto'?'Bruto':'Líquido']}/>
                <Legend formatter={v=>v==='bruto'?'Bruto':'Líquido'}/>
                <Area type="monotone" dataKey="bruto"   stroke="#10b981" fill="url(#gB2)" strokeWidth={2} name="bruto"/>
                <Area type="monotone" dataKey="liquido" stroke="#3b82f6" fill="url(#gL2)" strokeWidth={2} name="liquido"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico produtos */}
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Produtos mais vendidos</h3>
            <ResponsiveContainer width="100%" height={Math.max(200,(data?.porProduto?.length??0)*35)}>
              <BarChart data={data?.porProduto??[]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false}/>
                <XAxis type="number" tick={{fill:'#6b7280',fontSize:11}}/>
                <YAxis type="category" dataKey="nome" width={200} tick={{fill:'#9ca3af',fontSize:10}}
                  tickFormatter={(v:string)=>v.length>30?v.substring(0,30)+'…':v}/>
                <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}}
                  formatter={(v:any,n:any)=>[n==='vendas'?`${v} vendas`:formatCurrency(v),n==='vendas'?'Vendas':'Bruto']}/>
                <Legend/>
                <Bar dataKey="vendas" fill="#3b82f6" radius={[0,4,4,0]} name="vendas"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela completa */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Tabela Completa</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-3">#</th><th className="pb-3">Produto</th>
                    <th className="pb-3 text-right">Vendas</th><th className="pb-3 text-right">Bruto</th>
                    <th className="pb-3 text-right">Líquido</th><th className="pb-3 text-right">Ticket</th>
                    <th className="pb-3 text-right">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.porProduto??[]).map((p:any,i:number)=>(
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="py-2.5 text-gray-500 text-xs">{i+1}</td>
                      <td className="py-2.5 text-white">{p.nome}</td>
                      <td className="py-2.5 text-right font-bold text-white">{p.vendas}</td>
                      <td className="py-2.5 text-right text-green-400">{formatCurrency(p.bruto)}</td>
                      <td className="py-2.5 text-right text-blue-400">{formatCurrency(p.liquido)}</td>
                      <td className="py-2.5 text-right text-gray-300">{formatCurrency(p.bruto/p.vendas)}</td>
                      <td className="py-2.5 text-right text-gray-400">{((p.vendas/(data?.quantidade||1))*100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-700">
                    <td colSpan={2} className="py-3 font-bold text-white">TOTAL</td>
                    <td className="py-3 text-right font-bold text-white">{data?.quantidade}</td>
                    <td className="py-3 text-right font-bold text-green-400">{formatCurrency(data?.bruto??0)}</td>
                    <td className="py-3 text-right font-bold text-blue-400">{formatCurrency(data?.liquido??0)}</td>
                    <td className="py-3 text-right font-bold text-gray-300">{formatCurrency(data?.ticketMedio??0)}</td>
                    <td className="py-3 text-right font-bold text-white">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
