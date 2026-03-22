'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Bell, Mail, Check, AlertTriangle, Send, Calendar, Brain, RefreshCw, MessageSquare } from 'lucide-react'

const WEEK_DAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

export default function ConfiguracoesPage() {
  const [days,      setDays]      = useState(3)
  const [loading,   setLoading]   = useState(false)
  const [bills,     setBills]     = useState<any[]>([])
  const [total,     setTotal]     = useState(0)
  const [sent,      setSent]      = useState(false)
  const [checked,   setChecked]   = useState(false)
  const [hasResend, setHasResend] = useState<boolean | null>(null)

  // Consultor IA schedule
  const [schedule,       setSchedule]       = useState<any>(null)
  const [schedSaving,    setSchedSaving]     = useState(false)
  const [schedSaved,     setSchedSaved]      = useState(false)
  const [refreshing,     setRefreshing]      = useState(false)
  const [refreshDone,    setRefreshDone]     = useState(false)

  useEffect(() => {
    fetch('/api/pf/advisor/schedule').then(r => r.json()).then(d => setSchedule(d ?? {}))
  }, [])

  const saveSchedule = async () => {
    setSchedSaving(true); setSchedSaved(false)
    await fetch('/api/pf/advisor/schedule', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(schedule),
    })
    setSchedSaving(false); setSchedSaved(true)
    setTimeout(() => setSchedSaved(false), 2500)
  }

  const refreshNow = async () => {
    setRefreshing(true); setRefreshDone(false)
    await fetch('/api/pf/advisor/refresh', { method: 'POST' })
    setRefreshing(false); setRefreshDone(true)
    setTimeout(() => setRefreshDone(false), 3000)
  }

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

      {/* Consultor IA */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <Brain size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white">Consultor IA — Agenda de Orientações</h3>
        </div>
        <div className="p-6 space-y-5">
          {schedule && (
            <>
              {/* Toggles principais */}
              {[
                { key: 'enabled',          label: 'Orientações automáticas',         desc: 'Gera e atualiza orientações automaticamente a cada lançamento' },
                { key: 'receive_messages', label: 'Receber notificações in-app',      desc: 'Exibe alertas do Consultor no sino e no dashboard' },
                { key: 'receive_audio',    label: 'Receber orientações em áudio',     desc: 'Habilita os áudios semanais e mensais do Consultor' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setSchedule((s: any) => ({ ...s, [key]: !s[key] }))}
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${(schedule[key] ?? true) ? 'bg-emerald-600' : 'bg-gray-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${(schedule[key] ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}

              <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Áudio semanal — dia</label>
                  <select
                    value={schedule.weekly_day ?? 1}
                    onChange={e => setSchedule((s: any) => ({ ...s, weekly_day: Number(e.target.value) }))}
                    className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    {WEEK_DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Áudio mensal — dia</label>
                  <select
                    value={schedule.monthly_day ?? 1}
                    onChange={e => setSchedule((s: any) => ({ ...s, monthly_day: Number(e.target.value) }))}
                    className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Dia {d}</option>)}
                  </select>
                </div>
              </div>

              {/* WhatsApp — em breve */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-green-400" />
                  <p className="text-sm font-semibold text-white">WhatsApp</p>
                  <span className="text-[10px] bg-yellow-900 text-yellow-400 border border-yellow-700 rounded-full px-2 py-0.5 font-semibold">Em breve</span>
                </div>
                <input type="text" disabled
                  placeholder="+55 (11) 99999-9999 — aguardando aprovação da Meta BM"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
                <p className="text-[10px] text-gray-500 mt-2">
                  Assim que a Meta aprovar sua Business Manager, os áudios do Consultor serão enviados automaticamente no WhatsApp no horário configurado.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={refreshNow} disabled={refreshing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Consultando IA...' : 'Atualizar orientações agora'}
                </button>
                <button onClick={saveSchedule} disabled={schedSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  <Check size={14} /> {schedSaving ? 'Salvando...' : 'Salvar preferências'}
                </button>
              </div>

              {refreshDone && (
                <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm">
                  <Check size={15} /> Orientações atualizadas! Veja no dashboard ou no Consultor IA.
                </div>
              )}
              {schedSaved && (
                <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm">
                  <Check size={15} /> Preferências salvas!
                </div>
              )}
            </>
          )}
        </div>
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
