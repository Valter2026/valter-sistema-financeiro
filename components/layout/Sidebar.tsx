'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, DollarSign, Package, Megaphone, ChevronRight, Wallet
} from 'lucide-react'

const nav = [
  { href: '/dashboard',          label: 'Visão Geral',  icon: LayoutDashboard },
  { href: '/dashboard/vendas',   label: 'Vendas',       icon: TrendingUp },
  { href: '/dashboard/financeiro', label: 'Financeiro Eduzz', icon: DollarSign },
  { href: '/dashboard/produtos', label: 'Produtos',     icon: Package },
  { href: '/dashboard/trafego',  label: 'Tráfego',      icon: Megaphone },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 text-white flex flex-col z-10">
      <div className="px-5 py-6 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Valter Leite</p>
        <h1 className="text-lg font-bold text-white">CRM Gestão</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-3 border-t border-gray-700">
        <Link href="/financas"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-gray-800 hover:text-emerald-300 transition-colors">
          <Wallet size={18} />
          <span>Financeiro</span>
        </Link>
      </div>
    </aside>
  )
}
