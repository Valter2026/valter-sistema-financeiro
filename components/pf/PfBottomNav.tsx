'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Target, PieChart, MoreHorizontal, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

const main = [
  { href: '/pessoal',             label: 'Início',       icon: LayoutDashboard },
  { href: '/pessoal/lancamentos', label: 'Lançamentos',  icon: ArrowLeftRight  },
  { href: '/pessoal/metas',       label: 'Metas',        icon: Target          },
  { href: '/pessoal/relatorios',  label: 'Relatórios',   icon: PieChart        },
]

const more = [
  { href: '/pessoal/consultor',      label: 'Consultor IA'        },
  { href: '/pessoal/contas-pagar',   label: 'Contas a Pagar'      },
  { href: '/pessoal/cartoes',        label: 'Cartões'             },
  { href: '/pessoal/orcamento',      label: 'Orçamento'           },
  { href: '/pessoal/fluxo-caixa',    label: 'Fluxo de Caixa'      },
  { href: '/pessoal/balanco',        label: 'Balanço Patrimonial' },
  { href: '/pessoal/projetos',       label: 'Projetos'            },
  { href: '/pessoal/importar',       label: 'Importar Extrato'    },
  { href: '/pessoal/contas',         label: 'Contas'              },
  { href: '/pessoal/categorias',     label: 'Categorias'          },
  { href: '/pessoal/configuracoes',  label: 'Configurações'       },
  { href: '/dashboard',              label: '← Voltar ao CRM'     },
]

export default function PfBottomNav() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Overlay do menu "mais" */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {more.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center px-5 py-4 border-b border-gray-800 last:border-0 text-sm font-medium transition-colors ${
                  item.href === '/dashboard'
                    ? 'text-blue-400 hover:bg-gray-800'
                    : path.startsWith(item.href) ? 'text-emerald-400 bg-emerald-950/50' : 'text-gray-300 hover:bg-gray-800'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex md:hidden safe-area-bottom">
        {main.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/pessoal' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                active ? 'text-emerald-400' : 'text-gray-500'
              }`}>
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <button onClick={() => setOpen(!open)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
            open ? 'text-emerald-400' : 'text-gray-500'
          }`}>
          <MoreHorizontal size={22} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>
    </>
  )
}
