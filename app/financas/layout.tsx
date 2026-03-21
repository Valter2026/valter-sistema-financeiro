import FinSidebar from '@/components/fin/FinSidebar'

export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <FinSidebar />
      <main className="ml-60 p-8">
        {children}
      </main>
    </div>
  )
}
