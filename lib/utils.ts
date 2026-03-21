export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function getDateRange(period: 'hoje' | '7d' | '30d' | '90d' | '12m') {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'hoje': start.setHours(0, 0, 0, 0); break
    case '7d':   start.setDate(start.getDate() - 7); break
    case '30d':  start.setDate(start.getDate() - 30); break
    case '90d':  start.setDate(start.getDate() - 90); break
    case '12m':  start.setFullYear(start.getFullYear() - 1); break
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}
