'use client'
import { useEffect, useState } from 'react'
import FinSidebar from '@/components/fin/FinSidebar'
import FinNotificationBell from '@/components/fin/FinNotificationBell'

export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('fin-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)

    const handler = (e: Event) => {
      setCollapsed((e as CustomEvent).detail)
    }
    window.addEventListener('fin-sidebar-toggle', handler)
    return () => window.removeEventListener('fin-sidebar-toggle', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <FinSidebar />

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-20">
        <p className="text-sm font-bold text-white">Financeiro Empresarial</p>
        <FinNotificationBell />
      </header>

      {/* Desktop bell — fixed top right */}
      <div className="hidden md:flex fixed top-4 right-6 z-20">
        <FinNotificationBell />
      </div>

      <main className={`transition-all duration-200 p-8 pt-20 md:pt-8 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        {children}
      </main>
    </div>
  )
}
