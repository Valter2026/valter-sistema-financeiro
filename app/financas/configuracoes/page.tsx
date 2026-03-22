'use client'
import { useEffect, useState } from 'react'
import { Settings, Brain, Bell, Volume2, RefreshCw, Check } from 'lucide-react'

const WEEK_DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export default function FinConfiguracoesPage() {
  const [sched,   setSched]   = useState<any>(null)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    fetch('/api/fin/advisor/schedule').then(r => r.json()).then(setSched)
  }, [])

  const save = async () => {
    setSaving(true); setSaved(false)
    await fetch('/api/fin/advisor/schedule', {
      method: 'PUT',
      body: JSON.stringify(sched),
      headers: { 'content-type': 'application/json' },
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const runNow = async () => {
    setRunning(true)
    await fetch('/api/fin/advisor/refresh', { method: 'POST' })
    setRunning(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!sched) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
          <Settings size={18} className="text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Configurações</h2>
          <p className="text-gray-400 text-sm">Preferências do Consultor Empresarial IA</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ativar consultor */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={18} className="text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-white">Consultor Empresarial IA</p>
                <p className="text-xs text-gray-400">Análises e orientações financeiras automatizadas</p>
              </div>
            </div>
            <button onClick={() => setSched({ ...sched, enabled: !sched.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sched.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sched.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Receber orientações */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-white">Orientações e notificações</p>
                <p className="text-xs text-gray-400">Análises de DRE, inadimplência, capital de giro</p>
              </div>
            </div>
            <button onClick={() => setSched({ ...sched, receive_messages: !sched.receive_messages })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sched.receive_messages ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sched.receive_messages ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Receber áudios */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-white">Orientações em áudio</p>
                <p className="text-xs text-gray-400">Briefing semanal e análise mensal em voz</p>
              </div>
            </div>
            <button onClick={() => setSched({ ...sched, receive_audio: !sched.receive_audio })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sched.receive_audio ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sched.receive_audio ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Agendamentos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Agendamento dos áudios</p>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Briefing semanal — dia da semana</label>
            <select
              value={sched.weekly_day ?? 1}
              onChange={e => setSched({ ...sched, weekly_day: Number(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              {WEEK_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Análise mensal — dia do mês</label>
            <select
              value={sched.monthly_day ?? 1}
              onChange={e => setSched({ ...sched, monthly_day: Number(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              {Array.from({ length: 28 }, (_, i) => i+1).map(d => (
                <option key={d} value={d}>Dia {d}</option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-gray-600">Orientações enviadas automaticamente às 8h (horário de Brasília).</p>
        </div>

        {/* WhatsApp */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-semibold text-white">WhatsApp</p>
            <span className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Em breve</span>
          </div>
          <input
            type="text"
            placeholder="+55 (11) 99999-9999"
            disabled
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <RefreshCw size={14} className="animate-spin"/> : saved ? <Check size={14}/> : null}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
          </button>
          <button onClick={runNow} disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} />
            {running ? 'Atualizando...' : 'Atualizar agora'}
          </button>
        </div>
      </div>
    </div>
  )
}
