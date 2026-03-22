'use client'
import { useEffect, useState } from 'react'
import PfSidebar from '@/components/pf/PfSidebar'
import PfBottomNav from '@/components/pf/PfBottomNav'
import PfNotificationBell from '@/components/pf/PfNotificationBell'

export default function PessoalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem('pf-sidebar-collapsed')
      setCollapsed(saved === 'true')
    }
    sync()
    // Sincroniza quando o sidebar muda (via storage event entre abas ou via toggle)
    window.addEventListener('storage', sync)
    // Poll simples para pegar mudanças na mesma aba
    const iv = setInterval(sync, 300)
    return () => { window.removeEventListener('storage', sync); clearInterval(iv) }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar — só desktop */}
      <div className="hidden md:block">
        <PfSidebar />
      </div>

      {/* Header mobile com sino */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">Módulo</p>
          <h1 className="text-sm font-bold text-white leading-none">Finanças Pessoais</h1>
        </div>
        <PfNotificationBell />
      </header>

      {/* Sino desktop */}
      <div className="hidden md:block fixed top-3 right-4 z-30">
        <PfNotificationBell />
      </div>

      {/* Conteúdo — margem esquerda acompanha o sidebar */}
      <main className={`transition-all duration-200 p-4 md:p-8 pb-24 md:pb-8 pt-16 md:pt-8 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        {children}
      </main>

      {/* Bottom nav — só mobile */}
      <PfBottomNav />
    </div>
  )
}
