import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  variation?: number
  variationLabel?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

const colors = {
  blue:   'border-blue-500 bg-blue-950',
  green:  'border-green-500 bg-green-950',
  red:    'border-red-500 bg-red-950',
  yellow: 'border-yellow-500 bg-yellow-950',
  purple: 'border-purple-500 bg-purple-950',
}

export default function KpiCard({ title, value, subtitle, variation, variationLabel, color = 'blue' }: KpiCardProps) {
  return (
    <div className={`rounded-xl border-l-4 p-5 ${colors[color]}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
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
