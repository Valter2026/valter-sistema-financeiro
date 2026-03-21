'use client'
import { useState, useCallback } from 'react'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const ANOS  = [2024, 2025, 2026]

export type FilterState = {
  type: 'preset' | 'year' | 'month' | 'custom'
  preset?: string
  year?: number
  month?: number      // 1-12
  customStart?: string
  customEnd?: string
}

export function filterToParams(f: FilterState): { period?: string; start?: string; end?: string } {
  if (f.type === 'preset') return { period: f.preset }
  if (f.type === 'year')   return { period: String(f.year) }
  if (f.type === 'month') {
    const y  = f.year!
    const m  = f.month!
    const s  = `${y}-${String(m).padStart(2,'0')}-01`
    const e  = new Date(y, m, 0).toISOString().split('T')[0]
    return { start: s, end: e }
  }
  if (f.type === 'custom' && f.customStart && f.customEnd)
    return { start: f.customStart, end: f.customEnd }
  return { period: 'all' }
}

export function filterLabel(f: FilterState): string {
  if (f.type === 'preset') {
    const map: Record<string, string> = { '7d':'7 dias','30d':'30 dias','90d':'90 dias' }
    return map[f.preset!] ?? f.preset!
  }
  if (f.type === 'year')  return String(f.year)
  if (f.type === 'month') return `${MESES[(f.month ?? 1) - 1]}/${f.year}`
  if (f.type === 'custom') return `${f.customStart} → ${f.customEnd}`
  return 'Histórico'
}

type Props = {
  value: FilterState
  onChange: (f: FilterState) => void
  onSync?: () => void
  syncing?: boolean
  lastSync?: string
}

export default function FilterBar({ value, onChange, onSync, syncing, lastSync }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  const setPreset = useCallback((p: string) => {
    onChange({ type: 'preset', preset: p })
    setExpandedYear(null)
    setShowCustom(false)
  }, [onChange])

  const setYear = useCallback((y: number) => {
    onChange({ type: 'year', year: y })
    setExpandedYear(null)
    setShowCustom(false)
  }, [onChange])

  const setMonth = useCallback((y: number, m: number) => {
    onChange({ type: 'month', year: y, month: m })
    setExpandedYear(null)
    setShowCustom(false)
  }, [onChange])

  const applyCustom = useCallback(() => {
    if (customStart && customEnd) {
      onChange({ type: 'custom', customStart, customEnd })
      setShowCustom(false)
    }
  }, [customStart, customEnd, onChange])

  const isActive = (check: FilterState) => {
    if (check.type !== value.type) return false
    if (check.type === 'preset') return check.preset === value.preset
    if (check.type === 'year')   return check.year === value.year
    if (check.type === 'month')  return check.year === value.year && check.month === value.month
    return false
  }

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
    }`

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Presets */}
        {(['7d','30d','90d'] as const).map(p => (
          <button key={p} onClick={() => setPreset(p)}
            className={btn(value.type === 'preset' && value.preset === p)}>
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}

        <span className="text-gray-700 text-xs">|</span>

        {/* Anos com meses */}
        {ANOS.map(y => (
          <div key={y} className="relative">
            <div className="flex">
              <button
                onClick={() => setYear(y)}
                className={`px-3 py-1.5 rounded-l-lg text-xs font-medium transition-colors ${
                  value.type === 'year' && value.year === y
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {y}
              </button>
              <button
                onClick={() => setExpandedYear(expandedYear === y ? null : y)}
                className={`px-1.5 py-1.5 rounded-r-lg text-xs border-l border-gray-700 transition-colors ${
                  value.type === 'month' && value.year === y
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {expandedYear === y ? '▲' : '▼'}
              </button>
            </div>
            {expandedYear === y && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl p-2 grid grid-cols-4 gap-1 shadow-xl w-48">
                {MESES.map((m, i) => (
                  <button key={i}
                    onClick={() => setMonth(y, i + 1)}
                    className={btn(value.type === 'month' && value.year === y && value.month === i + 1)}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Histórico */}
        <button
          onClick={() => onChange({ type: 'preset', preset: 'all' })}
          className={btn(value.type === 'preset' && value.preset === 'all')}>
          Histórico
        </button>

        <span className="text-gray-700 text-xs">|</span>

        {/* Data customizada */}
        <button
          onClick={() => { setShowCustom(!showCustom); setExpandedYear(null) }}
          className={btn(value.type === 'custom')}>
          🗓 Período
        </button>

        {/* Sync */}
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 transition-colors ml-1">
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
          </button>
        )}
      </div>

      {/* Date range custom */}
      {showCustom && (
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl p-3">
          <span className="text-xs text-gray-400">De</span>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white" />
          <span className="text-xs text-gray-400">Até</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white" />
          <button onClick={applyCustom} disabled={!customStart || !customEnd}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
            Aplicar
          </button>
        </div>
      )}

      {/* Last sync info */}
      {lastSync && (
        <p className="text-xs text-gray-600">Última sincronização: {lastSync}</p>
      )}
    </div>
  )
}
