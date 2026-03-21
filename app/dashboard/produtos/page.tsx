'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

export default function ProdutosPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos')

  useEffect(() => {
    fetch('/api/eduzz/produtos')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const produtos = (data?.produtos ?? []).filter((p: any) => {
    if (filtro === 'ativo') return p.flg_status === 1 || p.status === 'active'
    if (filtro === 'inativo') return p.flg_status !== 1 && p.status !== 'active'
    return true
  })

  const ativos = (data?.produtos ?? []).filter((p: any) => p.flg_status === 1 || p.status === 'active').length
  const inativos = (data?.produtos ?? []).length - ativos

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Produtos</h2>
        <p className="text-gray-400 text-sm mt-1">Todos os seus produtos na Eduzz</p>
      </div>

      {error && <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">{error}</div>}

      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-400">Total de Produtos</p>
            <p className="text-2xl font-bold text-white">{data?.produtos?.length ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-400">Ativos</p>
            <p className="text-2xl font-bold text-green-400">{ativos}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border-l-4 border-red-500">
            <p className="text-xs text-gray-400">Inativos / Parados</p>
            <p className="text-2xl font-bold text-red-400">{inativos}</p>
            <p className="text-xs text-gray-500 mt-1">Oportunidade de receita</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Lista de Produtos</h3>
          <div className="flex gap-2">
            {(['todos', 'ativo', 'inativo'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filtro === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-3 font-medium">Produto</th>
                  <th className="pb-3 font-medium text-right">Preço</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p: any, i: number) => {
                  const ativo = p.flg_status === 1 || p.status === 'active'
                  return (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="py-3 text-white">{p.title ?? p.name ?? 'Sem nome'}</td>
                      <td className="py-3 text-right text-green-400 font-semibold">
                        {p.val_price ? formatCurrency(parseFloat(p.val_price)) : '—'}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ativo ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">{p.type_content ?? p.type ?? '—'}</td>
                    </tr>
                  )
                })}
                {produtos.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">Nenhum produto encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
