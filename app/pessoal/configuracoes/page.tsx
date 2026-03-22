'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Bell, Mail, Check, AlertTriangle, Send, Calendar } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [days,      setDays]      = useState(3)
  const [loading,   setLoading]   = useState(false)
  const [bills,     setBills]     = useState<any[]>([])
  const [total,     setTotal]     = useState(0)
  const [sent,      setSent]      = useState(false)
  const [checked,   setChecked]   = useState(false)
  const [hasResend, setHasResend] = useState<boolean | null>(null)

  const checkBills = async () => {
    setLoading(true); setSent(false)
    const res = await fetch(`/api/pf/notify?days=${days}`).then(r => r.json())
    setBills(res.bills ?? [])
    setTotal(res.total ?? 0)
    setChecked(true)
    setLoading(false)
  }

  const sendEmail = async () => {
    setLoading(true)
    const res = await fetch(`/api/pf/notify?days=${days}&send=1`).then(r => r.json())
    setSent(res.emailSent)
    setHasResend(res.emailSent)
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Configurações</h2>
        <p className="text-gray-400 text-sm mt-1">Notificações e preferências</p>
      </div>

      {/* Notificações */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <Bell size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white">Notificação de Vencimentos</h3>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avisar contas vencendo em</label>
            <div className="flex gap-2 mt-2">
              {[1, 3, 5, 7].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    days === d ? 'bg-emerald-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={checkBills} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
              <Calendar size={14} /> {loading ? 'Verificando...' : `Ver contas próximas ${days}d`}
            </button>
            <button onClick={sendEmail} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
              <Send size={14} /> Enviar Email
            </button>
          </div>

          {sent && (
            <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm">
              <Check size={15} /> Email enviado com sucesso!
            </div>
          )}

          {hasResend === false && checked && (
            <div className="bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-400 text-sm">
              <p className="font-semibold mb-1">Email não configurado</p>
              <p className="text-xs leading-relaxed">
                Para receber emails, adicione no Vercel Dashboard → Settings → Environment Variables:
                <br /><code className="text-yellow-300">RESEND_API_KEY</code> — sua chave do <strong>resend.com</strong> (gratuito)<br />
                <code className="text-yellow-300">NOTIFY_EMAIL</code> — seu email de destino
              </p>
            </div>
          )}

          {/* Lista de contas */}
          {checked && bills.length === 0 && (
            <div className="bg-gray-800 rounded-xl px-4 py-4 flex items-center gap-3">
              <Check size={18} className="text-emerald-400" />
              <p className="text-gray-300 text-sm">Nenhuma conta vencendo nos próximos {days} dia(s). 🎉</p>
            </div>
          )}

          {bills.length > 0 && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{bills.length} conta(s) nos próximos {days}d</span>
                <span className="text-sm font-bold text-red-400">{formatCurrency(total)}</span>
              </div>
              <div className="divide-y divide-gray-700">
                {bills.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                    <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 font-medium truncate">
                        {b.category?.icon ?? ''} {b.description || b.category?.name || '—'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Vence {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-red-400">{formatCurrency(Number(b.amount))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info do sistema */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <Mail size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white">Como configurar email</h3>
        </div>
        <div className="p-6 space-y-3 text-sm text-gray-400">
          <ol className="space-y-2 list-decimal list-inside">
            <li>Acesse <strong className="text-gray-300">resend.com</strong> e crie uma conta gratuita</li>
            <li>Gere uma <strong className="text-gray-300">API Key</strong></li>
            <li>No <strong className="text-gray-300">Vercel Dashboard</strong> → Settings → Environment Variables, adicione:
              <div className="mt-2 bg-gray-800 rounded-xl p-3 space-y-1 font-mono text-xs">
                <p><span className="text-emerald-400">RESEND_API_KEY</span>=re_xxxxxxxxxxxxxxxx</p>
                <p><span className="text-emerald-400">NOTIFY_EMAIL</span>=valter@eurosolucoes.com</p>
              </div>
            </li>
            <li>Faça <strong className="text-gray-300">Redeploy</strong> no Vercel para aplicar</li>
          </ol>
          <p className="text-xs text-gray-600 mt-2">O plano gratuito do Resend permite 3.000 emails/mês.</p>
        </div>
      </div>
    </div>
  )
}
