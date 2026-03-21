import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  variation?: number
  variationLabel?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  extraLabel?: string
  extraValue?: string
  extraColor?: 'amber' | 'cyan' | 'green' | 'purple'
}

const colors = {
  blue:   'border-blue-500 bg-blue-950',
  green:  'border-green-500 bg-green-950',
  red:    'border-red-500 bg-red-950',
  yellow: 'border-yellow-500 bg-yellow-950',
  purple: 'border-purple-500 bg-purple-950',
}

const extraColors = {
  amber:  'bg-amber-950 border border-amber-700 text-amber-300',
  cyan:   'bg-cyan-950 border border-cyan-700 text-cyan-300',
  green:  'bg-green-950 border border-green-700 text-green-300',
  purple: 'bg-purple-950 border border-purple-700 text-purple-300',
}

export default function KpiCard({ title, value, subtitle, variation, variationLabel, color = 'blue', extraLabel, extraValue, extraColor = 'amber' }: KpiCardProps) {
  return (
    <div className={`rounded-xl border-l-4 p-5 ${colors[color]}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {extraLabel && extraValue && (
        <div className={`mt-3 rounded-lg px-3 py-2 flex items-center justify-between ${extraColors[extraColor]}`}>
          <span className="text-xs font-medium">{extraLabel}</span>
          <span className="text-sm font-bold">{extraValue}</span>
        </div>
      )}
      {variation !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          variation > 0 ? 'text-green-400' : variation < 0 ? 'text-red-400' : 'text-gray-400'
        }`}>
          {variation > 0 ? <TrendingUp size={13} /> : variation < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
          {variation > 0 ? '+' : ''}{variation.toFixed(1)}% {variationLabel ?? 'vs mês anterior'}
        </div>
      )}
    </div>
  )
}
