import PfSidebar from '@/components/pf/PfSidebar'

export default function PessoalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <PfSidebar />
      <main className="ml-56 p-8">{children}</main>
    </div>
  )
}
