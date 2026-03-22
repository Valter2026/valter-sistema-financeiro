'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, ArrowDownCircle, Target,
  CreditCard, Tag, PieChart, ChevronRight, ChevronLeft, Mic,
  TrendingUp, Upload, Settings, BarChart2
} from 'lucide-react'

const nav = [
  { href: '/pessoal',                label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/pessoal/lancamentos',    label: 'Lançamentos',    icon: ArrowLeftRight  },
  { href: '/pessoal/contas-pagar',   label: 'Contas a Pagar', icon: ArrowDownCircle },
  { href: '/pessoal/cartoes',        label: 'Cartões',        icon: CreditCard      },
  { href: '/pessoal/metas',          label: 'Metas',          icon: Target          },
  { href: '/pessoal/orcamento',      label: 'Orçamento',      icon: PieChart        },
  { href: '/pessoal/fluxo-caixa',    label: 'Fluxo de Caixa', icon: TrendingUp      },
  { href: '/pessoal/relatorios',     label: 'Relatórios',     icon: BarChart2       },
  { href: '/pessoal/importar',       label: 'Importar',       icon: Upload          },
  { href: '/pessoal/contas',         label: 'Contas',         icon: CreditCard      },
  { href: '/pessoal/categorias',     label: 'Categorias',     icon: Tag             },
  { href: '/pessoal/configuracoes',  label: 'Configurações',  icon: Settings        },
]

export default function PfSidebar() {
  const path = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
      <div className="px-5 py-6 border-b border-gray-800">
        <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-1">Módulo</p>
        <h1 className="text-lg font-bold text-white">Finanças Pessoais</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/pessoal' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon size={17} className={active ? 'text-white' : 'text-gray-500'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} className="text-emerald-200" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800 space-y-2">
        <Link href="/pessoal/lancamentos?voz=1"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors">
          <Mic size={13} /> Lançar por Voz
        </Link>
        <Link href="/dashboard"
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors px-1">
          <ChevronLeft size={13} />
          Voltar ao CRM
        </Link>
      </div>
    </aside>
  )
}
