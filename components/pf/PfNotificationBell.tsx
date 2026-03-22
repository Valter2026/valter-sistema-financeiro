'use client'
import { useEffect, useState, useRef } from 'react'
import { Bell, Brain, X, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'

const TYPE_COLOR: Record<string, string> = {
  alert:   'bg-red-500',
  warning: 'bg-yellow-500',
  tip:     'bg-emerald-500',
  goal:    'bg-blue-500',
  success: 'bg-emerald-400',
}

export default function PfNotificationBell() {
  const [notifs,  setNotifs]  = useState<any[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read).length

  const load = async () => {
    const data = await fetch('/api/pf/notifications?limit=15').then(r => r.json())
    setNotifs(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 60_000) // recarrega a cada 1 minuto
    return () => clearInterval(iv)
  }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAll = async () => {
    setLoading(true)
    await fetch('/api/pf/notifications', { method: 'PUT', body: JSON.stringify({ id: 'all' }), headers: { 'content-type': 'application/json' } })
    await load()
    setLoading(false)
  }

  const markOne = async (id: string) => {
    await fetch('/api/pf/notifications', { method: 'PUT', body: JSON.stringify({ id }), headers: { 'content-type': 'application/json' } })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const clearRead = async () => {
    await fetch('/api/pf/notifications', { method: 'DELETE' })
    await load()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">Consultor IA</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">{unread} nova{unread > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAll} disabled={loading} title="Marcar todas como lidas"
                  className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                  <Check size={13} />
                </button>
              )}
              <button onClick={clearRead} title="Limpar lidas"
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                <Trash2 size={13} />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
            {notifs.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Nenhuma orientação ainda.<br />
                <span className="text-xs">Lance uma transação para receber dicas.</span>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors ${n.read ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLOR[n.type] ?? 'bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      {n.action_text && (
                        <p className="text-[10px] text-emerald-400 mt-1 font-medium">→ {n.action_text}</p>
                      )}
                      <p className="text-[9px] text-gray-600 mt-1">
                        {new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-800">
            <Link href="/pessoal/consultor" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              <Brain size={12} /> Ver Consultor Completo →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
