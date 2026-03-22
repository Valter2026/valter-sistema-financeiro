'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  TrendingUp, FileBarChart2, CreditCard, Tag, Upload, ChevronRight, ChevronLeft,
  Brain, Settings, PanelLeftClose, PanelLeftOpen
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
  { href: '/financas/consultor',      label: 'Consultor IA',      icon: Brain },
  { href: '/financas/configuracoes',  label: 'Configurações',     icon: Settings },
]

export default function FinSidebar() {
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('fin-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('fin-sidebar-collapsed', String(next))
    window.dispatchEvent(new CustomEvent('fin-sidebar-toggle', { detail: next }))
  }

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-800 flex flex-col z-10 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
      <div className={`px-3 py-6 border-b border-gray-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1">Módulo</p>
            <h1 className="text-lg font-bold text-white">Financeiro</h1>
          </div>
        )}
        <button onClick={toggle} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors flex-shrink-0">
          {collapsed ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}>
              <Icon size={17} className={active ? 'text-white' : 'text-gray-500'} />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && active && <ChevronRight size={13} className="text-blue-200" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <Link href="/dashboard" title={collapsed ? 'Voltar ao CRM' : undefined}
          className={`flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <ChevronLeft size={13} />
          {!collapsed && 'Voltar ao CRM'}
        </Link>
      </div>
    </aside>
  )
}
