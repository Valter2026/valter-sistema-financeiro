'use client'
import { useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Upload, Trash2, Check, AlertTriangle, FileText, X } from 'lucide-react'

interface Row {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  skip?: boolean
}

// ─── Parser OFX ──────────────────────────────────────────────────────────────
function parseOFX(text: string): Row[] {
  const rows: Row[] = []
  const txBlocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? []
  for (const block of txBlocks) {
    const get = (tag: string) => block.match(new RegExp(`<${tag}>([^<\n\r]+)`, 'i'))?.[1]?.trim() ?? ''
    const rawDate = get('DTPOSTED').substring(0, 8) // YYYYMMDD
    if (!rawDate || rawDate.length < 8) continue
    const date  = `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}`
    const rawAmt = parseFloat(get('TRNAMT').replace(',', '.'))
    const memo  = get('MEMO') || get('NAME') || 'Importado'
    rows.push({
      date,
      description: memo,
      amount: Math.abs(rawAmt),
      type:   rawAmt < 0 ? 'expense' : 'income',
    })
  }
  return rows
}

// ─── Parser CSV ───────────────────────────────────────────────────────────────
function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const sep   = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

  const iData  = headers.findIndex(h => /data|date|dt/.test(h))
  const iDesc  = headers.findIndex(h => /descri|histor|memo|name|lançamento|lancamento/.test(h))
  const iValor = headers.findIndex(h => /valor|value|amount|montante|quantia/.test(h))
  const iTipo  = headers.findIndex(h => /tipo|type|crédito|credito|débito|debito/.test(h))

  if (iValor === -1) return []

  const rows: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
    if (cols.length < 2) continue

    // Data: tenta DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
    const rawDate = cols[iData] ?? ''
    let date = ''
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split('/')
      date = `${y}-${m}-${d}`
    } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      date = rawDate.substring(0, 10)
    } else if (/^\d{2}-\d{2}-\d{4}/.test(rawDate)) {
      const [d, m, y] = rawDate.split('-')
      date = `${y}-${m}-${d}`
    } else {
      continue
    }

    // Valor: remove R$, pontos de milhar, troca vírgula por ponto
    const rawVal = (cols[iValor] ?? '0')
      .replace(/R\$\s*/gi, '').replace(/\./g, '').replace(',', '.').trim()
    const amount = Math.abs(parseFloat(rawVal))
    if (isNaN(amount) || amount === 0) continue

    // Tipo: deduz por sinal ou coluna
    let type: 'income' | 'expense' = parseFloat(rawVal) < 0 ? 'expense' : 'income'
    if (iTipo !== -1) {
      const t = (cols[iTipo] ?? '').toLowerCase()
      if (/déb|deb|saída|saida|compra/.test(t))  type = 'expense'
      if (/créd|cred|entrada|depósito|deposito/.test(t)) type = 'income'
    }

    rows.push({
      date,
      description: cols[iDesc] ?? 'Importado',
      amount,
      type,
    })
  }
  return rows
}

export default function ImportarPage() {
  const [rows,    setRows]    = useState<Row[]>([])
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState<number | null>(null)
  const [error,   setError]   = useState('')
  const [dragging,setDragging]= useState(false)

  const processFile = (file: File) => {
    setDone(null); setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      let parsed: Row[] = []
      if (file.name.toLowerCase().endsWith('.ofx') || text.includes('<OFX>') || text.includes('<ofx>')) {
        parsed = parseOFX(text)
      } else {
        parsed = parseCSV(text)
      }
      if (parsed.length === 0) {
        setError('Nenhum lançamento encontrado. Verifique o formato do arquivo.')
      } else {
        setRows(parsed)
      }
    }
    reader.readAsText(file, 'ISO-8859-1')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const toggleSkip = (i: number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, skip: !r.skip } : r))
  }

  const handleImport = async () => {
    const valid = rows.filter(r => !r.skip)
    if (valid.length === 0) return
    setSaving(true); setError('')
    const res = await fetch('/api/pf/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: valid }),
    }).then(r => r.json())
    setSaving(false)
    if (res.ok) { setDone(res.count); setRows([]) }
    else setError(res.error ?? 'Erro ao importar.')
  }

  const activeRows = rows.filter(r => !r.skip)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Importar Extrato</h2>
        <p className="text-gray-400 text-sm mt-1">Suporte a OFX (extrato bancário) e CSV</p>
      </div>

      {done !== null && (
        <div className="mb-6 bg-emerald-950 border border-emerald-800 rounded-xl p-5 flex items-center gap-3">
          <Check size={20} className="text-emerald-400" />
          <div>
            <p className="text-white font-semibold">{done} lançamento(s) importado(s) com sucesso!</p>
            <button onClick={() => setDone(null)} className="text-xs text-emerald-400 mt-0.5 hover:underline">
              Importar outro arquivo
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {rows.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors mb-6 ${
            dragging ? 'border-emerald-500 bg-emerald-950/20' : 'border-gray-700 hover:border-gray-600'
          }`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
              <Upload size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="text-gray-300 font-semibold">Arraste o arquivo aqui</p>
              <p className="text-gray-500 text-sm mt-1">ou clique para selecionar</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400">OFX</span>
              <span className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400">CSV</span>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".ofx,.csv,.txt" onChange={onFileChange} className="hidden" />
              <span className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors inline-block">
                Selecionar arquivo
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Dicas de formato */}
      {rows.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-300">Formato OFX</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Disponível em: Bradesco, Itaú, BB, Santander, Caixa, Nubank e a maioria dos bancos.<br /><br />
              Acesse o internet banking → Extrato → Exportar/Baixar → selecione <strong className="text-gray-400">OFX</strong>.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-gray-300">Formato CSV</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Colunas necessárias (em qualquer ordem):<br />
              <code className="text-gray-400">Data, Descrição, Valor</code><br /><br />
              Separador por vírgula ou ponto-e-vírgula. Data: DD/MM/AAAA ou AAAA-MM-DD.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-950 border border-red-800 rounded-xl p-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-semibold">{rows.length} lançamentos encontrados</p>
              <p className="text-gray-500 text-xs mt-0.5">{activeRows.length} selecionados para importar</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRows([])}
                className="px-4 py-2 rounded-xl text-sm border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button onClick={handleImport} disabled={saving || activeRows.length === 0}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {saving ? 'Importando...' : <><Check size={14} /> Importar {activeRows.length}</>}
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-800 bg-gray-800/50">
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={activeRows.length === rows.length}
                        onChange={() => setRows(prev => prev.map(r => ({ ...r, skip: activeRows.length === rows.length })))}
                        className="rounded" />
                    </th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide">Data</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide">Descrição</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide">Tipo</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide text-right">Valor</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-b border-gray-800 transition-colors ${r.skip ? 'opacity-30' : 'hover:bg-gray-800/50'}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={!r.skip} onChange={() => toggleSkip(i)} className="rounded" />
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-gray-200 max-w-xs truncate">{r.description}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.type === 'income' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                        }`}>
                          {r.type === 'income' ? '+ Entrada' : '− Saída'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${r.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSkip(i)} className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
