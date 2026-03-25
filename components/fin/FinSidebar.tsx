'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  TrendingUp, FileBarChart2, CreditCard, Tag, Upload, ChevronRight, ChevronLeft,
  Brain, Settings, PanelLeftClose, PanelLeftOpen, CalendarDays, X
} from 'lucide-react'

const nav = [
  { href: '/financas',                label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/financas/lancamentos',    label: 'Lançamentos',       icon: ArrowLeftRight },
  { href: '/financas/agenda',         label: 'Agenda',            icon: CalendarDays },
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

interface Props {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function FinSidebar({ mobileOpen, onClose }: Props) {
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
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-800 flex flex-col z-50
        transition-all duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        ${collapsed ? 'md:w-16' : 'md:w-56'} w-56
      `}>
        <div className={`px-3 py-6 border-b border-gray-800 flex items-center ${collapsed ? 'md:justify-center' : 'justify-between'}`}>
          <div className={collapsed ? 'md:hidden' : ''}>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1">Módulo</p>
            <h1 className="text-lg font-bold text-white">Financeiro</h1>
          </div>
          {/* Botão fechar — mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
          {/* Botão colapsar — desktop */}
          <button
            onClick={toggle}
            className="hidden md:block p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors flex-shrink-0">
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href
            return (
              <Link key={href} href={href}
                title={collapsed ? label : undefined}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                } ${collapsed ? 'md:justify-center' : ''}`}>
                <Icon size={17} className={active ? 'text-white' : 'text-gray-500'} />
                <span className={collapsed ? 'md:hidden' : ''}>{label}</span>
                {!collapsed && active && <ChevronRight size={13} className="text-blue-200 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <Link href="/dashboard"
            title={collapsed ? 'Voltar ao CRM' : undefined}
            onClick={onClose}
            className={`flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors ${collapsed ? 'md:justify-center' : ''}`}>
            <ChevronLeft size={13} />
            <span className={collapsed ? 'md:hidden' : ''}>Voltar ao CRM</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
