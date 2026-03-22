'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  TrendingUp, FileBarChart2, CreditCard, Tag, Upload, ChevronRight, ChevronLeft
} from 'lucide-react'

const nav = [
  { href: '/financas',                label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/financas/lancamentos',    label: 'Lançamentos',       icon: ArrowLeftRight },
  { href: '/financas/contas-pagar',   label: 'Contas a Pagar',    icon: ArrowDownCircle },
  { href: '/financas/contas-receber', label: 'Contas a Receber',  icon: ArrowUpCircle },
  { href: '/financas/fluxo-caixa',    label: 'Fluxo de Caixa',    icon: TrendingUp },
  { href: '/financas/dre',            label: 'DRE Gerencial',     icon: FileBarChart2 },
  { href: '/financas/contas',         label: 'Contas',            icon: CreditCard },
  { href: '/financas/categorias',     label: 'Categorias',        icon: Tag },
  { href: '/financas/importar',       label: 'Importar',          icon: Upload },
]

export default function FinSidebar() {
  const path = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
      <div className="px-5 py-6 border-b border-gray-800">
        <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1">Módulo</p>
        <h1 className="text-lg font-bold text-white">Financeiro</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon size={17} className={active ? 'text-white' : 'text-gray-500'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} className="text-blue-200" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <Link href="/dashboard"
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ChevronLeft size={13} />
          Voltar ao CRM
        </Link>
      </div>
    </aside>
  )
}
