import PfSidebar from '@/components/pf/PfSidebar'
import PfBottomNav from '@/components/pf/PfBottomNav'
import PfNotificationBell from '@/components/pf/PfNotificationBell'

export default function PessoalLayout({ children }: { children: React.ReactNode }) {
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

      {/* Sino desktop — dentro da sidebar via portal não é prático, usar fixed */}
      <div className="hidden md:block fixed top-3 right-4 z-30">
        <PfNotificationBell />
      </div>

      {/* Conteúdo */}
      <main className="md:ml-56 p-4 md:p-8 pb-24 md:pb-8 pt-16 md:pt-8">
        {children}
      </main>

      {/* Bottom nav — só mobile */}
      <PfBottomNav />
    </div>
  )
}
