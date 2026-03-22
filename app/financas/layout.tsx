import FinSidebar from '@/components/fin/FinSidebar'

export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <FinSidebar />
      <main className="ml-56 p-8">
        {children}
      </main>
    </div>
  )
}
