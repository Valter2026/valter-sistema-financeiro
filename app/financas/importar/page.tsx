'use client'
import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PreviewRow {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
}

export default function ImportarPage() {
  const [file,     setFile]     = useState<File | null>(null)
  const [preview,  setPreview]  = useState<PreviewRow[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [accountId, setAccountId] = useState('')
  const [step,     setStep]     = useState<'upload'|'preview'|'done'>('upload')
  const [importing,setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [error,    setError]    = useState('')

  const loadMeta = useCallback(async () => {
    const [acc, cat] = await Promise.all([
      fetch('/api/fin/accounts').then(r => r.json()),
      fetch('/api/fin/categories').then(r => r.json()),
    ])
    setAccounts(Array.isArray(acc) ? acc : [])
    setCategories(Array.isArray(cat) ? cat : [])
  }, [])

  const parseCSV = (text: string): PreviewRow[] => {
    const lines = text.split('\n').filter(l => l.trim())
    const rows: PreviewRow[] = []
    for (const line of lines.slice(1)) {
      const cols = line.split(';').map(c => c.trim().replace(/"/g,''))
      if (cols.length < 3) continue
      const [dateRaw, desc, amtRaw] = cols
      const amt = parseFloat(amtRaw.replace(',','.'))
      if (isNaN(amt)) continue
      const [d, m, y] = dateRaw.split('/').length === 3 ? dateRaw.split('/') : dateRaw.split('-')
      const date = dateRaw.includes('/') ? `${y}-${m}-${d}` : dateRaw
      rows.push({ date, description: desc, amount: Math.abs(amt), type: amt < 0 ? 'expense' : 'income' })
    }
    return rows
  }

  const handleFile = async (f: File) => {
    setFile(f); setError('')
    await loadMeta()
    const text = await f.text()
    let rows: PreviewRow[] = []
    if (f.name.toLowerCase().endsWith('.csv')) {
      rows = parseCSV(text)
    } else {
      setError('Formato não suportado. Use CSV com separador ponto e vírgula.')
      return
    }
    if (rows.length === 0) { setError('Nenhuma linha válida encontrada no arquivo.'); return }
    setPreview(rows)
    setStep('preview')
  }

  const handleImport = async () => {
    if (!accountId) { setError('Selecione uma conta.'); return }
    setImporting(true); setError('')
    let count = 0
    for (const row of preview) {
      const cat = categories.find(c => c.type === row.type && !c.parent_id)
      await fetch('/api/fin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: row.type,
          account_id: accountId,
          category_id: cat?.id ?? null,
          amount: row.amount,
          date: row.date,
          description: row.description,
          status: 'confirmed',
        }),
      })
      count++
    }
    setImportedCount(count)
    setImporting(false)
    setStep('done')
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Importar Lançamentos</h2>
        <p className="text-gray-400 text-sm mt-1">CSV de banco, cartão ou planilha</p>
      </div>

      {/* Passos */}
      <div className="flex items-center gap-2 mb-8">
        {[['upload','1. Arquivo'],['preview','2. Revisão'],['done','3. Concluído']].map(([k,l], i) => (
          <div key={k} className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              step === k ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400'
            }`}>{l}</div>
            {i < 2 && <div className="w-6 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <div className="space-y-6">
          {/* Formato CSV */}
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Formato esperado do CSV</p>
                <p className="text-xs text-blue-600 mb-2">O arquivo deve ter ponto e vírgula (;) como separador e a primeira linha como cabeçalho:</p>
                <code className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg block font-mono">
                  Data;Descrição;Valor<br />
                  01/03/2026;Recebimento cliente;1500,00<br />
                  05/03/2026;Conta de luz;-250,00
                </code>
                <p className="text-xs text-blue-500 mt-2">Valores negativos = despesa · Positivos = receita · Data em DD/MM/AAAA ou AAAA-MM-DD</p>
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-16 px-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors bg-white"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}>
            <Upload size={36} className="text-gray-300 mb-4" />
            <p className="text-gray-600 font-semibold">Arraste o arquivo aqui</p>
            <p className="text-gray-400 text-sm mt-1">ou clique para selecionar</p>
            <p className="text-xs text-gray-300 mt-3">CSV · até 10.000 linhas</p>
            <input type="file" accept=".csv,.txt" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Conta de destino</p>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Selecione a conta...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{preview.length} lançamentos encontrados</p>
                <p className="text-sm font-bold text-gray-700 mt-0.5">
                  {formatCurrency(preview.filter(r => r.type === 'income').reduce((a,r) => a + r.amount, 0))} receitas ·{' '}
                  {formatCurrency(preview.filter(r => r.type === 'expense').reduce((a,r) => a + r.amount, 0))} despesas
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-3 font-semibold">Data</th>
                    <th className="px-5 py-3 font-semibold">Descrição</th>
                    <th className="px-5 py-3 font-semibold text-right">Valor</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-gray-500 text-xs">{new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="px-5 py-2.5 text-gray-700">{row.description}</td>
                      <td className={`px-5 py-2.5 text-right font-bold ${row.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}>{row.type === 'income' ? 'Receita' : 'Despesa'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setStep('upload'); setPreview([]); setFile(null) }}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
              Voltar
            </button>
            <button onClick={handleImport} disabled={importing || !accountId}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {importing ? `Importando... (${importedCount}/${preview.length})` : `Importar ${preview.length} lançamentos`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{importedCount} lançamentos importados!</h3>
          <p className="text-gray-400 text-sm mb-6">Os dados já estão disponíveis em Lançamentos.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep('upload'); setPreview([]); setFile(null); setImportedCount(0) }}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
              Importar outro arquivo
            </button>
            <a href="/financas/lancamentos"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
              Ver Lançamentos
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
