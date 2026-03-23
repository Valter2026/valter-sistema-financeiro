'use client'
import { useState, useEffect, useCallback } from 'react'
import { Mic, Plus, ChevronLeft, ChevronRight, Trash2, Check, Clock, Calendar, Phone, Users, Utensils, Bell, AlertTriangle, Stethoscope } from 'lucide-react'
import PfAppointmentModal from '@/components/pf/PfAppointmentModal'

const TYPE_ICONS: Record<string, any> = {
  meeting:     Users,
  visit:       Calendar,
  call:        Phone,
  reminder:    Bell,
  deadline:    AlertTriangle,
  lunch:       Utensils,
  appointment: Stethoscope,
}

const TYPE_LABELS: Record<string, string> = {
  meeting:     'Reunião',
  visit:       'Visita',
  call:        'Ligação',
  reminder:    'Lembrete',
  deadline:    'Prazo',
  lunch:       'Almoço',
  appointment: 'Consulta',
}

const TYPE_COLORS: Record<string, string> = {
  meeting:     'text-emerald-400 bg-emerald-950',
  visit:       'text-violet-400 bg-violet-950',
  call:        'text-sky-400 bg-sky-950',
  reminder:    'text-yellow-400 bg-yellow-950',
  deadline:    'text-red-400 bg-red-950',
  lunch:       'text-orange-400 bg-orange-950',
  appointment: 'text-teal-400 bg-teal-950',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'text-blue-400',
  confirmed: 'text-green-400',
  cancelled: 'text-red-400',
  done:      'text-gray-500',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function PfAgendaPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState<any>(null)
  const [voiceOpen,    setVoiceOpen]    = useState(false)
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [selectedDay,  setSelectedDay]  = useState<string | null>(null)

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const load = useCallback(async () => {
    setLoading(true)
    const firstDay = new Date(year, month, 1)
    const lastDay  = new Date(year, month + 1, 0)
    const data = await fetch(`/api/pf/appointments?start=${isoDate(firstDay)}&end=${isoDate(lastDay)}`)
      .then(r => r.json()).catch(() => [])
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const byDay = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return appointments.filter(a => a.date === key)
  }

  const todayStr = isoDate(new Date())
  const selectedAppts = selectedDay ? appointments.filter(a => a.date === selectedDay) : []

  const deleteAppt = async (id: string) => {
    await fetch('/api/pf/appointments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const markDone = async (appt: any) => {
    await fetch('/api/pf/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...appt, status: 'done' }),
    })
    load()
  }

  const upcoming = appointments
    .filter(a => a.date >= todayStr && a.status !== 'done' && a.status !== 'cancelled')
    .slice(0, 5)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Agenda</h1>
          <p className="text-gray-500 text-sm">Finanças Pessoais</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditing(null); setVoiceOpen(true) }}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors">
            <Mic size={15} />
            <span className="hidden sm:inline">Por Voz</span>
          </button>
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors">
            <Plus size={15} />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Próximos compromissos */}
      {upcoming.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Próximos</h2>
          <div className="space-y-2">
            {upcoming.map(a => {
              const Icon = TYPE_ICONS[a.type] ?? Calendar
              const colors = TYPE_COLORS[a.type] ?? 'text-gray-400 bg-gray-800'
              return (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => { setEditing(a); setModalOpen(true) }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{a.title}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      {a.time ? ` · ${a.time}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_COLORS[a.status] ?? 'text-gray-500'}`}>
                    {a.date === todayStr ? 'Hoje' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendário */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-sm font-bold text-white">{MONTHS[month]} {year}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-800">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="aspect-square border-b border-r border-gray-800/50" />
            }
            const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const appts = byDay(day)
            const isToday    = key === todayStr
            const isSelected = key === selectedDay
            return (
              <button key={idx} onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`aspect-square border-b border-r border-gray-800/50 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors ${
                  isSelected ? 'bg-emerald-950' : isToday ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                }`}>
                <span className={`text-xs font-semibold leading-none ${
                  isToday ? 'text-emerald-400' : isSelected ? 'text-emerald-300' : 'text-gray-400'
                }`}>{day}</span>
                <div className="flex gap-0.5 flex-wrap justify-center px-0.5">
                  {appts.slice(0, 3).map((a, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                      a.status === 'done' ? 'bg-gray-600' :
                      a.type === 'deadline' ? 'bg-red-500' :
                      a.type === 'appointment' ? 'bg-teal-500' :
                      a.type === 'call' ? 'bg-sky-500' :
                      a.type === 'reminder' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalhe do dia selecionado */}
      {selectedDay && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </h2>
            <button onClick={() => { setEditing({ date: selectedDay }); setModalOpen(true) }}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              <Plus size={12} /> Adicionar
            </button>
          </div>

          {selectedAppts.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Nenhum compromisso neste dia</p>
          ) : (
            <div className="space-y-2">
              {selectedAppts.map(a => {
                const Icon = TYPE_ICONS[a.type] ?? Calendar
                const colors = TYPE_COLORS[a.type] ?? 'text-gray-400 bg-gray-800'
                return (
                  <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl bg-gray-800 ${a.status === 'done' ? 'opacity-50' : ''}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${a.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{TYPE_LABELS[a.type] ?? a.type}</span>
                        {a.time && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-500">
                            <Clock size={10} />{a.time}
                          </span>
                        )}
                        <span className={`text-xs ${STATUS_COLORS[a.status] ?? 'text-gray-500'}`}>
                          {a.status === 'scheduled' ? 'Agendado' :
                           a.status === 'confirmed' ? 'Confirmado' :
                           a.status === 'cancelled' ? 'Cancelado' : 'Realizado'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {a.status !== 'done' && a.status !== 'cancelled' && (
                        <button onClick={() => markDone(a)} title="Marcar como realizado"
                          className="p-1.5 rounded-lg text-gray-600 hover:text-green-400 hover:bg-gray-700 transition-colors">
                          <Check size={13} />
                        </button>
                      )}
                      <button onClick={() => deleteAppt(a.id)} title="Excluir"
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-700 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <PfAppointmentModal
        open={modalOpen || voiceOpen}
        onClose={() => { setModalOpen(false); setVoiceOpen(false); setEditing(null) }}
        onSaved={load}
        initial={voiceOpen ? undefined : editing}
      />
    </div>
  )
}
