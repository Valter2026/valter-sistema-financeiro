'use client'
import { useState } from 'react'
import { Loader2, CheckCircle, AlertCircle, Play, BarChart3 } from 'lucide-react'

type SyncResult = { period: string; synced: number; status: 'pending' | 'running' | 'done' | 'error'; error?: string }

function generatePeriods(startYear: number): { start: string; end: string; label: string }[] {
  const periods: { start: string; end: string; label: string }[] = []
  const now = new Date()
  let year = startYear
  let month = 1

  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth() + 1)) {
    const m = String(month).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = new Date(year, month - 1, lastDay)
    const end = endDate > now ? now.toISOString().split('T')[0] : `${year}-${m}-${lastDay}`

    periods.push({
      start: `${year}-${m}-01`,
      end,
      label: `${new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })} ${year}`,
    })

    month++
    if (month > 12) { month = 1; year++ }
  }

  return periods
}

export default function SyncPage() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<SyncResult[]>([])
  const [totalSynced, setTotalSynced] = useState(0)
  const [userId, setUserId] = useState('e44febb8-9d4a-4a8c-9f90-374ad564fa0c')
  const [startYear, setStartYear] = useState(2024)

  const runFullSync = async () => {
    setRunning(true)
    setTotalSynced(0)
    const periods = generatePeriods(startYear)
    const newResults: SyncResult[] = periods.map(p => ({ period: p.label, synced: 0, status: 'pending' }))
    setResults([...newResults])

    let total = 0

    for (let i = 0; i < periods.length; i++) {
      newResults[i].status = 'running'
      setResults([...newResults])

      try {
        const res = await fetch(`/api/sync?start=${periods[i].start}&end=${periods[i].end}&user_id=${userId}`)
        const data = await res.json()

        if (data.ok) {
          newResults[i].synced = data.synced
          newResults[i].status = 'done'
          total += data.synced
        } else {
          newResults[i].status = 'error'
          newResults[i].error = data.error || 'Erro desconhecido'
        }
      } catch (err: any) {
        newResults[i].status = 'error'
        newResults[i].error = err.message || 'Timeout'
      }

      setTotalSynced(total)
      setResults([...newResults])

      // Pausa entre requisições para evitar rate limit
      if (i < periods.length - 1) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    setRunning(false)
  }

  const done = results.filter(r => r.status === 'done').length
  const errors = results.filter(r => r.status === 'error').length

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sync Eduzz</h1>
            <p className="text-gray-400 text-sm">Sincronizar vendas da Eduzz com o banco de dados</p>
          </div>
        </div>

        {/* Config */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 space-y-3">
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">User ID</label>
            <input value={userId} onChange={e => setUserId(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">Ano inicial</label>
            <select value={startYear} onChange={e => setStartYear(Number(e.target.value))}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        {/* Botão */}
        <button onClick={runFullSync} disabled={running}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-6">
          {running ? <><Loader2 size={16} className="animate-spin" /> Sincronizando...</> : <><Play size={16} /> Iniciar Sync Completo</>}
        </button>

        {/* Progresso */}
        {results.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-400">Progresso: {done}/{results.length} meses</span>
              <span className="text-green-400 font-bold">{totalSynced} registros</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(done / results.length) * 100}%` }} />
            </div>
            {errors > 0 && <p className="text-red-400 text-xs mt-2">{errors} erro(s) — verifique abaixo</p>}
          </div>
        )}

        {/* Lista de resultados */}
        <div className="space-y-1">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
              r.status === 'running' ? 'bg-blue-950 border border-blue-800' :
              r.status === 'done' ? 'bg-gray-900' :
              r.status === 'error' ? 'bg-red-950 border border-red-800' : 'bg-gray-900/50'
            }`}>
              <div className="flex items-center gap-2">
                {r.status === 'running' && <Loader2 size={14} className="animate-spin text-blue-400" />}
                {r.status === 'done' && <CheckCircle size={14} className="text-green-400" />}
                {r.status === 'error' && <AlertCircle size={14} className="text-red-400" />}
                {r.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-gray-700" />}
                <span className={r.status === 'pending' ? 'text-gray-600' : 'text-gray-300'}>{r.period}</span>
              </div>
              <span className={r.status === 'done' ? 'text-green-400' : r.status === 'error' ? 'text-red-400' : 'text-gray-600'}>
                {r.status === 'done' ? `${r.synced} vendas` : r.status === 'error' ? r.error : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
