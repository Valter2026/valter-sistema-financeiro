'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import KpiCard from '@/components/ui/KpiCard'
import FilterBar, { FilterState, filterToParams, filterLabel } from '@/components/ui/FilterBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ProdutosPage() {
  const [vendas,  setVendas]  = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string|null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync,setLastSync]= useState('')
  const [filter,  setFilter]  = useState<FilterState>({ type: 'preset', preset: 'all' })
  const [busca,   setBusca]   = useState('')
  const [ordem,   setOrdem]   = useState<'vendas'|'bruto'|'liquido'|'ticket'>('bruto')

  const load = useCallback((f: FilterState) => {
    setLoading(true); setError(null)
    const p  = filterToParams(f)
    const qs = new URLSearchParams(p as any).toString()
    fetch(`/api/eduzz/vendas?${qs}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setVendas(d) })
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

  const todosProdutos: any[] = (vendas?.porProduto ?? [])
    .map((p: any) => ({ ...p, ticket: p.vendas > 0 ? p.bruto / p.vendas : 0 }))

  const top10 = [...todosProdutos]
    .sort((a: any, b: any) => b.bruto - a.bruto)
    .slice(0, 10)

  const produtos: any[] = todosProdutos
    .filter((p: any) => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a: any, b: any) => b[ordem] - a[ordem])

  const totalBruto  = vendas?.bruto   ?? 0
  const totalVendas = vendas?.quantidade ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Produtos</h2>
          <p className="text-gray-400 text-sm mt-1">
            {vendas ? `${produtos.length} produtos com vendas · ${filterLabel(filter)}` : 'Carregando...'}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <FilterBar value={filter} onChange={f => { setFilter(f); load(f) }} onSync={handleSync} syncing={syncing} lastSync={lastSync} />
      </div>

      {error && <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">Erro: {error}</div>}

      {!loading && vendas && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Produtos Ativos"  value={String(produtos.length)}             color="green" subtitle="com venda no período" />
            <KpiCard title="Faturamento Total" value={formatCurrency(totalBruto)}         color="green" />
            <KpiCard title="Total de Vendas"  value={String(totalVendas)}                 color="blue" />
            <KpiCard title="Ticket Médio"     value={formatCurrency(vendas?.ticketMedio)} color="purple" />
          </div>

          {/* Top 10 gráfico */}
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Top 10 — Faturamento Bruto</h3>
            <ResponsiveContainer width="100%" height={Math.min(400, Math.max(200, top10.length * 40))}>
              <BarChart data={top10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false}/>
                <XAxis type="number" tick={{fill:'#6b7280',fontSize:11}} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                <YAxis type="category" dataKey="nome" width={200} tick={{fill:'#9ca3af',fontSize:10}}
                  tickFormatter={(v:string)=>v.length>28?v.substring(0,28)+'…':v}/>
                <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}}
                  formatter={(v:any)=>[formatCurrency(v),'Bruto']}/>
                <Bar dataKey="bruto" fill="#10b981" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Busca e ordenação */}
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              {(['vendas','bruto','liquido','ticket'] as const).map(o => (
                <button key={o} onClick={() => setOrdem(o)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    ordem === o ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {o === 'vendas' ? 'Qtd' : o === 'bruto' ? 'Bruto' : o === 'liquido' ? 'Líquido' : 'Ticket'}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela completa */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Todos os Produtos com Vendas — {filterLabel(filter)}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-3">#</th>
                    <th className="pb-3">Produto</th>
                    <th className="pb-3 text-right cursor-pointer" onClick={() => setOrdem('vendas')}>
                      Vendas {ordem==='vendas'&&'▼'}
                    </th>
                    <th className="pb-3 text-right cursor-pointer" onClick={() => setOrdem('bruto')}>
                      Bruto {ordem==='bruto'&&'▼'}
                    </th>
                    <th className="pb-3 text-right cursor-pointer" onClick={() => setOrdem('liquido')}>
                      Líquido {ordem==='liquido'&&'▼'}
                    </th>
                    <th className="pb-3 text-right cursor-pointer" onClick={() => setOrdem('ticket')}>
                      Ticket {ordem==='ticket'&&'▼'}
                    </th>
                    <th className="pb-3 text-right">% Bruto</th>
                    <th className="pb-3 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="py-2.5 text-gray-500 text-xs">{i+1}</td>
                      <td className="py-2.5 text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"/>
                          {p.nome}
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold text-white">{p.vendas}</td>
                      <td className="py-2.5 text-right text-green-400">{formatCurrency(p.bruto)}</td>
                      <td className="py-2.5 text-right text-blue-400">{formatCurrency(p.liquido)}</td>
                      <td className="py-2.5 text-right text-gray-300">{formatCurrency(p.ticket)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-800 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{width:`${Math.min(100,((p.bruto/totalBruto)*100)).toFixed(0)}%`}}/>
                          </div>
                          <span className="text-gray-400 text-xs">{totalBruto>0?((p.bruto/totalBruto)*100).toFixed(1):0}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`text-xs font-medium ${p.bruto>0?(p.liquido/p.bruto*100)>70?'text-green-400':'text-yellow-400':'text-gray-500'}`}>
                          {p.bruto > 0 ? `${((p.liquido/p.bruto)*100).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-700">
                    <td colSpan={2} className="py-3 font-bold text-white">TOTAL</td>
                    <td className="py-3 text-right font-bold text-white">{totalVendas}</td>
                    <td className="py-3 text-right font-bold text-green-400">{formatCurrency(totalBruto)}</td>
                    <td className="py-3 text-right font-bold text-blue-400">{formatCurrency(vendas?.liquido ?? 0)}</td>
                    <td className="py-3 text-right font-bold text-gray-300">{formatCurrency(vendas?.ticketMedio ?? 0)}</td>
                    <td className="py-3 text-right font-bold text-white">100%</td>
                    <td className="py-3 text-right font-bold">
                      <span className="text-xs text-gray-300">
                        {totalBruto > 0 ? `${((vendas.liquido/totalBruto)*100).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="space-y-3">{[...Array(6)].map((_,i)=><div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse"/>)}</div>
      )}
    </div>
  )
}
