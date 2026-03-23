'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ArrowLeftRight, ArrowDownCircle, Target,
  CreditCard, Tag, PieChart, ChevronRight, ChevronLeft, Mic,
  TrendingUp, Upload, Settings, BarChart2, Wallet, FolderOpen,
  Brain, PanelLeftClose, PanelLeftOpen, CalendarDays
} from 'lucide-react'

const nav = [
  { href: '/pessoal',                label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/pessoal/consultor',      label: 'Consultor IA',   icon: Brain           },
  { href: '/pessoal/lancamentos',    label: 'Lançamentos',    icon: ArrowLeftRight  },
  { href: '/pessoal/agenda',         label: 'Agenda',         icon: CalendarDays    },
  { href: '/pessoal/contas-pagar',   label: 'Contas a Pagar', icon: ArrowDownCircle },
  { href: '/pessoal/cartoes',        label: 'Cartões',        icon: CreditCard      },
  { href: '/pessoal/metas',          label: 'Metas',          icon: Target          },
  { href: '/pessoal/orcamento',      label: 'Orçamento',      icon: PieChart        },
  { href: '/pessoal/fluxo-caixa',    label: 'Fluxo de Caixa', icon: TrendingUp      },
  { href: '/pessoal/relatorios',     label: 'Relatórios',     icon: BarChart2       },
  { href: '/pessoal/balanco',        label: 'Balanço',        icon: Wallet          },
  { href: '/pessoal/projetos',       label: 'Projetos',       icon: FolderOpen      },
  { href: '/pessoal/importar',       label: 'Importar',       icon: Upload          },
  { href: '/pessoal/contas',         label: 'Contas',         icon: CreditCard      },
  { href: '/pessoal/categorias',     label: 'Categorias',     icon: Tag             },
  { href: '/pessoal/configuracoes',  label: 'Configurações',  icon: Settings        },
]

export default function PfSidebar() {
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Persiste o estado no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pf-sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  const toggle = () => {
    setCollapsed(v => {
      localStorage.setItem('pf-sidebar-collapsed', String(!v))
      return !v
    })
  }

  const w = collapsed ? 'w-16' : 'w-56'

  return (
    <aside className={`fixed left-0 top-0 h-screen ${w} bg-gray-900 border-r border-gray-800 flex flex-col z-10 transition-all duration-200`}>

      {/* Header */}
      <div className={`flex items-center border-b border-gray-800 ${collapsed ? 'justify-center px-0 py-5' : 'justify-between px-4 py-5'}`}>
        {!collapsed && (
          <div>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-0.5">Módulo</p>
            <h1 className="text-base font-bold text-white leading-tight">Finanças Pessoais</h1>
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0">
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/pessoal' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg font-medium transition-colors ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon size={17} className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm truncate">{label}</span>
                  {active && <ChevronRight size={13} className="text-emerald-200 flex-shrink-0" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-gray-800 py-3 space-y-2 ${collapsed ? 'px-2' : 'px-3'}`}>
        <Link href="/pessoal/lancamentos?voz=1"
          title={collapsed ? 'Lançar por Voz' : undefined}
          className={`flex items-center gap-2 w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
          <Mic size={13} className="flex-shrink-0" />
          {!collapsed && 'Lançar por Voz'}
        </Link>
        <Link href="/dashboard"
          title={collapsed ? 'Voltar ao CRM' : undefined}
          className={`flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors ${collapsed ? 'justify-center' : 'px-1'}`}>
          <ChevronLeft size={13} className="flex-shrink-0" />
          {!collapsed && 'Voltar ao CRM'}
        </Link>
      </div>
    </aside>
  )
}
