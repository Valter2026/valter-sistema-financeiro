import PfSidebar from '@/components/pf/PfSidebar'
import PfBottomNav from '@/components/pf/PfBottomNav'

export default function PessoalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar — só desktop */}
      <div className="hidden md:block">
        <PfSidebar />
      </div>

      {/* Conteúdo */}
      <main className="md:ml-56 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom nav — só mobile */}
      <PfBottomNav />
    </div>
  )
}
