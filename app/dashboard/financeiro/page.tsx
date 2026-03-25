'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import KpiCard from '@/components/ui/KpiCard'
import FilterBar, { FilterState, filterToParams, filterLabel } from '@/components/ui/FilterBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function mesLabel(mes: string) {
  const [y, m] = mes.split('-')
  return `${MESES_LABEL[parseInt(m)-1]}/${y.slice(2)}`
}

export default function FinanceiroPage() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string|null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync,setLastSync]= useState('')
  const [filter,  setFilter]  = useState<FilterState>({ type: 'year', year: 2026 })

  const load = useCallback((f: FilterState) => {
    setLoading(true); setError(null)
    const p  = filterToParams(f)
    const qs = new URLSearchParams(p as any).toString()
    fetch(`/api/eduzz/financeiro?${qs}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
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

  const per  = data?.periodo
  const mes  = data?.mes
  const ant  = data?.anterior

  // DRE dinâmico — segue o filtro selecionado
  const dreRows = per ? [
    { label: 'Receita Bruta',       value: per.bruto,         sign: +1, bold: false, indent: false },
    { label: '(-) Taxa Plataforma', value: per.taxaPlat,      sign: -1, bold: false, indent: true  },
    { label: '(-) Taxa COOP',       value: per.taxaCoop,      sign: -1, bold: false, indent: true  },
    { label: '(-) Reembolsos',      value: per.reembolso,     sign: -1, bold: false, indent: true  },
    { label: '(=) Receita Líquida', value: per.liquido,       sign: +1, bold: true,  indent: false },
    { label: 'Margem Líquida %',    value: null,              sign: +1, bold: false, indent: false, pct: per.margemLiquida },
  ] : []

  // Totais do período selecionado
  const dreAnual = data?.dreAnual ?? []
  const totalBruto   = dreAnual.reduce((a: number, r: any) => a + r.bruto,     0)
  const totalLiq     = dreAnual.reduce((a: number, r: any) => a + r.liquido,   0)
  const totalTaxas   = dreAnual.reduce((a: number, r: any) => a + r.taxas,     0)
  const totalReemb   = dreAnual.reduce((a: number, r: any) => a + r.reembolso, 0)
  const totalVendas  = dreAnual.reduce((a: number, r: any) => a + r.vendas,    0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Financeiro</h2>
          <p className="text-gray-400 text-sm mt-1">DRE · Comparativos · Reembolsos — {filterLabel(filter)}</p>
        </div>
      </div>

      <div className="mb-6">
        <FilterBar value={filter} onChange={f => { setFilter(f); load(f) }} onSync={handleSync} syncing={syncing} lastSync={lastSync} />
      </div>

      {error && <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">Erro: {error}</div>}

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_,i)=><div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse"/>)}</div>
      ) : (
        <>
          {/* KPIs período selecionado */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Período selecionado — {filterLabel(filter)}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard title="Receita Bruta"    value={formatCurrency(per?.bruto ?? 0)}    color="green" />
            <KpiCard title="Receita Líquida"  value={formatCurrency(per?.liquido ?? 0)}  color="blue" subtitle={`Margem: ${per?.margemLiquida ?? 0}%`} />
            <KpiCard title="Taxas Pagas"      value={formatCurrency(per?.totalTaxas ?? 0)} color="red" />
            <KpiCard title="Saldo Disponível" value={formatCurrency(data?.saldo ?? 0)}   color="yellow"
              subtitle="disponível para saque agora"
              extraLabel="⚡ Antecipável" extraValue={formatCurrency(data?.saldoFuturo ?? 0)} extraColor="amber" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard title="Vendas Pagas"     value={String(per?.quantidade ?? 0)}        color="blue" />
            <KpiCard title="Ticket Médio"     value={formatCurrency(per?.ticket ?? 0)}    color="purple" />
            <KpiCard title="Reembolsos"       value={formatCurrency(per?.reembolso ?? 0)} color="red"
              subtitle={`${per?.reembolsoQtd ?? 0} transações`} />
            <KpiCard title="% Reemb / Bruto"  value={`${per?.pctReembolsoBruto ?? 0}%`}  color="red"
              subtitle={`% líquido: ${per?.pctReembolsoLiq ?? 0}%`} />
          </div>

          {/* KPIs mês atual */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 mt-6">Mês atual vs anterior</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard title="Bruto (mês atual)"  value={formatCurrency(mes?.bruto ?? 0)}   color="green" variation={data?.crescimentoBruto} />
            <KpiCard title="Líquido (mês atual)" value={formatCurrency(mes?.liquido ?? 0)} color="blue" subtitle={`Margem: ${mes?.bruto > 0 ? ((mes.liquido / mes.bruto) * 100).toFixed(1) : 0}%`} />
            <KpiCard title="Taxas (mês)"        value={formatCurrency(mes?.totalTaxas ?? 0)} color="red" />
            <KpiCard title="Vendas (mês)"       value={String(mes?.quantidade ?? 0)}       color="blue" subtitle={`Ticket: ${formatCurrency(mes?.ticket ?? 0)}`} />
          </div>

          {/* DRE período selecionado + comparativo */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-5">DRE — {filterLabel(filter)}</h3>
              <div className="space-y-1">
                {dreRows.map((row, i) => (
                  <div key={i} className={`flex items-center justify-between py-3 border-b border-gray-800 ${row.bold?'bg-gray-800 px-3 rounded-lg':''}`}>
                    <span className={`text-sm ${row.indent?'pl-4 text-gray-400':'text-gray-200'} ${row.bold?'font-bold text-white':''}`}>{row.label}</span>
                    {row.pct !== undefined ? (
                      <span className={`text-sm font-semibold ${(row.pct??0)>70?'text-green-400':(row.pct??0)>50?'text-yellow-400':'text-red-400'}`}>
                        {formatPercent(row.pct??0)}
                      </span>
                    ) : (
                      <span className={`text-sm font-semibold ${row.sign>0?'text-green-400':'text-red-400'} ${row.bold?'text-base':''}`}>
                        {row.sign<0?'- ':''}{formatCurrency(row.value??0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-5">Mês Atual vs Anterior</h3>
              <div className="space-y-4">
                {[
                  { label: 'Receita Bruta',  atual: mes?.bruto,       ant: ant?.bruto },
                  { label: 'Rec. Líquida',   atual: mes?.liquido,     ant: ant?.liquido },
                  { label: 'Taxas',          atual: mes?.totalTaxas,  ant: ant?.totalTaxas },
                  { label: 'Vendas',         atual: mes?.quantidade,  ant: ant?.quantidade, currency: false },
                  { label: 'Ticket Médio',   atual: mes?.ticket,      ant: ant?.ticket },
                  { label: 'Reembolsos',     atual: mes?.reembolso,   ant: ant?.reembolso },
                ].map((row, i) => {
                  const var_ = (row.ant??0)>0?(((row.atual??0)-(row.ant??0))/(row.ant??1))*100 : 0
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{row.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-white">
                          {row.currency===false ? row.atual : formatCurrency(row.atual??0)}
                        </span>
                        <span className={`ml-2 text-xs font-medium ${var_>=0?'text-green-400':'text-red-400'}`}>
                          {var_>=0?'+':''}{var_.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* DRE mensal detalhado */}
          {dreAnual.length > 0 && (
            <>
              <div className="bg-gray-900 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Evolução Mensal — {filterLabel(filter)}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dreAnual.map((r: any) => ({ ...r, label: mesLabel(r.mes) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                    <XAxis dataKey="label" tick={{fill:'#6b7280',fontSize:11}}/>
                    <YAxis tick={{fill:'#6b7280',fontSize:11}} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                    <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}}
                      formatter={(v:any,n:any)=>[formatCurrency(v),n==='bruto'?'Bruto':n==='liquido'?'Líquido':'Taxas']}/>
                    <Legend formatter={v=>v==='bruto'?'Bruto':v==='liquido'?'Líquido':'Taxas'}/>
                    <Bar dataKey="bruto"   fill="#10b981" radius={[4,4,0,0]} name="bruto"/>
                    <Bar dataKey="liquido" fill="#3b82f6" radius={[4,4,0,0]} name="liquido"/>
                    <Bar dataKey="taxas"   fill="#ef4444" radius={[4,4,0,0]} name="taxas"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela DRE mês a mês */}
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">DRE Mês a Mês — {filterLabel(filter)}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                        <th className="pb-3">Mês</th>
                        <th className="pb-3 text-right">Vendas</th>
                        <th className="pb-3 text-right">Bruto</th>
                        <th className="pb-3 text-right">Taxas</th>
                        <th className="pb-3 text-right">Reembolsos</th>
                        <th className="pb-3 text-right">Líquido</th>
                        <th className="pb-3 text-right">Margem</th>
                        <th className="pb-3 text-right">% Reemb</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dreAnual.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                          <td className="py-2.5 text-white font-medium">{mesLabel(r.mes)}</td>
                          <td className="py-2.5 text-right text-gray-300">{r.vendas}</td>
                          <td className="py-2.5 text-right text-green-400">{formatCurrency(r.bruto)}</td>
                          <td className="py-2.5 text-right text-red-400">{formatCurrency(r.taxas)}</td>
                          <td className="py-2.5 text-right text-orange-400">{r.reembolso > 0 ? formatCurrency(r.reembolso) : '—'}</td>
                          <td className="py-2.5 text-right text-blue-400">{formatCurrency(r.liquido)}</td>
                          <td className="py-2.5 text-right">
                            <span className={`text-xs font-medium ${r.margem>70?'text-green-400':r.margem>50?'text-yellow-400':'text-red-400'}`}>
                              {r.margem}%
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-gray-400">
                            {r.pctReembolso > 0 ? `${r.pctReembolso}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-700">
                        <td className="py-3 font-bold text-white">TOTAL</td>
                        <td className="py-3 text-right font-bold text-white">{totalVendas}</td>
                        <td className="py-3 text-right font-bold text-green-400">{formatCurrency(totalBruto)}</td>
                        <td className="py-3 text-right font-bold text-red-400">{formatCurrency(totalTaxas)}</td>
                        <td className="py-3 text-right font-bold text-orange-400">{totalReemb > 0 ? formatCurrency(totalReemb) : '—'}</td>
                        <td className="py-3 text-right font-bold text-blue-400">{formatCurrency(totalLiq)}</td>
                        <td className="py-3 text-right font-bold">
                          <span className={`text-xs font-medium ${totalBruto>0?(totalLiq/totalBruto*100)>70?'text-green-400':'text-yellow-400':'text-gray-400'}`}>
                            {totalBruto > 0 ? `${((totalLiq/totalBruto)*100).toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-gray-400">
                          {totalBruto > 0 ? `${((totalReemb/totalBruto)*100).toFixed(2)}%` : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
