'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  TrendingUp, FileBarChart2, CreditCard, Tag, Import, ChevronRight, ChevronLeft
} from 'lucide-react'

const nav = [
  { href: '/financas',               label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/financas/lancamentos',   label: 'Lançamentos',      icon: ArrowLeftRight },
  { href: '/financas/contas-pagar',  label: 'Contas a Pagar',   icon: ArrowDownCircle },
  { href: '/financas/contas-receber',label: 'Contas a Receber', icon: ArrowUpCircle },
  { href: '/financas/fluxo-caixa',   label: 'Fluxo de Caixa',   icon: TrendingUp },
  { href: '/financas/dre',           label: 'DRE Gerencial',    icon: FileBarChart2 },
  { href: '/financas/contas',        label: 'Contas',           icon: CreditCard },
  { href: '/financas/categorias',    label: 'Categorias',       icon: Tag },
  { href: '/financas/importar',      label: 'Importar',         icon: Import },
]

export default function FinSidebar() {
  const path = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-xs text-blue-500 font-semibold uppercase tracking-widest mb-0.5">Módulo</p>
        <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
              <Icon size={17} className={active ? 'text-blue-600' : 'text-gray-400'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} className="text-blue-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <Link href="/dashboard"
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft size={13} />
          Voltar ao CRM
        </Link>
      </div>
    </aside>
  )
}
