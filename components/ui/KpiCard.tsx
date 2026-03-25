import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  variation?: number
  variationLabel?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'
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
  orange: 'border-orange-500 bg-orange-950',
}

const extraColors = {
  amber:  'bg-amber-950 border border-amber-700 text-amber-300',
  cyan:   'bg-cyan-950 border border-cyan-700 text-cyan-300',
  green:  'bg-green-950 border border-green-700 text-green-300',
  purple: 'bg-purple-950 border border-purple-700 text-purple-300',
}

export default function KpiCard({
  title, value, subtitle, variation, variationLabel,
  color = 'blue', extraLabel, extraValue, extraColor = 'amber'
}: KpiCardProps) {
  return (
    <div className={`rounded-xl border-l-4 p-3 md:p-5 ${colors[color]}`}>
      <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide mb-1 truncate">{title}</p>
      <p className="text-sm md:text-xl font-bold text-white tabular-nums truncate">{value}</p>
      {subtitle && <p className="text-[10px] md:text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
      {extraLabel && extraValue && (
        <div className={`mt-2 md:mt-3 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex items-center justify-between gap-2 ${extraColors[extraColor]}`}>
          <span className="text-[10px] md:text-xs font-medium truncate">{extraLabel}</span>
          <span className="text-xs md:text-sm font-bold tabular-nums flex-shrink-0">{extraValue}</span>
        </div>
      )}
      {variation !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 md:mt-2 text-[10px] md:text-xs font-medium ${
          variation > 0 ? 'text-green-400' : variation < 0 ? 'text-red-400' : 'text-gray-400'
        }`}>
          {variation > 0 ? <TrendingUp size={11} /> : variation < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
          <span className="truncate">{variation > 0 ? '+' : ''}{variation.toFixed(1)}% {variationLabel ?? 'vs mês anterior'}</span>
        </div>
      )}
    </div>
  )
}
