'use client'
import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Header mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 h-14">
        <div>
          <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">Valter Leite</p>
          <h1 className="text-sm font-bold text-white leading-none">CRM Gestão</h1>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <Menu size={20} />
        </button>
      </header>

      <main className="md:ml-56 p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}
