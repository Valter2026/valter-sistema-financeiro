'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  Brain, RefreshCw, Volume2, VolumeX, Send, AlertTriangle,
  Lightbulb, Target, CheckCircle, Mic, MicOff, X, Sparkles,
  Calendar, CalendarDays, Play, Square, ChevronDown, ChevronUp
} from 'lucide-react'

interface Advice {
  type:     'alert' | 'warning' | 'tip' | 'goal' | 'success'
  title:    string
  message:  string
  action:   string
  priority: 'high' | 'medium' | 'low'
}

const TYPE_CONFIG = {
  alert:   { label:'Alerta',   bg:'bg-red-950',     border:'border-red-800',     text:'text-red-400',     icon: AlertTriangle, iconColor:'text-red-400'     },
  warning: { label:'Atenção',  bg:'bg-yellow-950',  border:'border-yellow-800',  text:'text-yellow-400',  icon: AlertTriangle, iconColor:'text-yellow-400'  },
  tip:     { label:'Dica',     bg:'bg-gray-900',    border:'border-emerald-800', text:'text-emerald-400', icon: Lightbulb,     iconColor:'text-emerald-400' },
  goal:    { label:'Meta',     bg:'bg-blue-950',    border:'border-blue-800',    text:'text-blue-400',    icon: Target,        iconColor:'text-blue-400'    },
  success: { label:'Parabéns', bg:'bg-emerald-950', border:'border-emerald-800', text:'text-emerald-300', icon: CheckCircle,   iconColor:'text-emerald-400' },
}

const VOICE_LABEL = { feminina: '👩 Consultora', masculina: '👨 Consultor' }

function AudioCard({
  title, icon: Icon, iconColor, endpoint, voice, pitch,
}: {
  title: string
  icon: any
  iconColor: string
  endpoint: string
  voice: 'feminina' | 'masculina'
  pitch: number
}) {
  const [script,      setScript]      = useState('')
  const [genAt,       setGenAt]       = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [playing,     setPlaying]     = useState(false)
  const [expanded,    setExpanded]    = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis
    setGenerating(true)
    // GET já auto-gera se não existir
    fetch(endpoint).then(r => r.json()).then(d => {
      if (d.script) { setScript(d.script); setGenAt(d.generated_at ?? '') }
      setGenerating(false)
    }).catch(() => setGenerating(false))
  }, [endpoint])

  const generate = async () => {
    setGenerating(true)
    const res = await fetch(endpoint, { method: 'POST' }).then(r => r.json())
    if (res.script) { setScript(res.script); setGenAt(new Date().toISOString()) }
    setGenerating(false)
  }

  const togglePlay = () => {
    if (!synthRef.current) return
    if (playing) {
      synthRef.current.cancel()
      setPlaying(false)
      return
    }
    const utter  = new SpeechSynthesisUtterance(script)
    utter.lang   = 'pt-BR'
    utter.rate   = 1.0
    utter.pitch  = pitch
    const voices = synthRef.current.getVoices()
    const ptV    = voices.filter(v => v.lang.startsWith('pt'))
    const sel    = voice === 'feminina'
      ? (ptV.find(v => /female|feminino/i.test(v.name)) ?? ptV[0])
      : (ptV.find(v => /male|masculino/i.test(v.name))  ?? ptV[ptV.length-1] ?? ptV[0])
    if (sel) utter.voice = sel
    utter.onend   = () => setPlaying(false)
    utter.onerror = () => setPlaying(false)
    setPlaying(true)
    synthRef.current.speak(utter)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
            <Icon size={17} className={iconColor} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            {genAt
              ? <p className="text-[10px] text-gray-500">Gerado em {new Date(genAt).toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
              : <p className="text-[10px] text-gray-600">Nenhum script gerado ainda</p>
            }
          </div>
        </div>
        <div className="flex items-center gap-2">
          {script && (
            <button onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
              {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
          )}
          {script && (
            <button onClick={togglePlay}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${playing ? 'bg-emerald-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'}`}>
              {playing ? <><Square size={11} fill="currentColor"/> Parar</> : <><Play size={11} fill="currentColor"/> Ouvir</>}
            </button>
          )}
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Gerando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Transcript expandível */}
      {expanded && script && (
        <div className="px-5 pb-5 border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Texto do áudio</p>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{script}</p>
        </div>
      )}
    </div>
  )
}

export default function ConsultorPage() {
  const [advices,    setAdvices]    = useState<Advice[]>([])
  const [context,    setContext]    = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [speaking,   setSpeaking]   = useState<number | null>(null)
  const [voice,      setVoice]      = useState<'feminina'|'masculina'>('feminina')
  const [question,   setQuestion]   = useState('')
  const [asking,     setAsking]     = useState(false)
  const [listening,  setListening]  = useState(false)
  const [error,      setError]      = useState('')
  const [genAt,      setGenAt]      = useState('')
  const recogRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis
  }, [])

  // Carrega do cache (instantâneo, sem chamar IA)
  const loadCache = useCallback(async () => {
    setLoading(true); setError('')
    const res = await fetch('/api/pf/advisor/refresh').then(r => r.json())
    if (Array.isArray(res.advices) && res.advices.length > 0) {
      setAdvices(res.advices)
      setGenAt(res.generated_at ?? '')
    }
    setLoading(false)
  }, [])

  // Atualização completa (chama IA — botão Atualizar ou pergunta livre)
  const load = useCallback(async (q = '') => {
    setLoading(true); setError(''); setAdvices([])
    const url = q ? `/api/pf/advisor?q=${encodeURIComponent(q)}` : '/api/pf/advisor/refresh'
    if (q) {
      // Pergunta livre → chama IA diretamente
      const res = await fetch(`/api/pf/advisor?q=${encodeURIComponent(q)}`).then(r => r.json())
      if (res.error) { setError(res.error) }
      else { setAdvices(res.advices ?? []); setContext(res.context ?? null); setGenAt(res.generatedAt ?? '') }
    } else {
      // Atualizar → dispara refresh (POST salva no cache) depois lê
      const res = await fetch('/api/pf/advisor/refresh', { method: 'POST' }).then(r => r.json())
      if (res.error) { setError(res.error) }
      else { await loadCache() }
    }
    setLoading(false)
  }, [loadCache])

  useEffect(() => { loadCache() }, [loadCache])

  const handleAsk = async () => {
    if (!question.trim()) return
    setAsking(true)
    await load(question.trim())
    setQuestion('')
    setAsking(false)
  }

  const speak = (text: string, idx: number) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    if (speaking === idx) { setSpeaking(null); return }
    const utter    = new SpeechSynthesisUtterance(text)
    utter.lang     = 'pt-BR'
    utter.rate     = 1.05
    utter.pitch    = voice === 'feminina' ? 1.2 : 0.85
    const voices   = synthRef.current.getVoices()
    const ptVoices = voices.filter(v => v.lang.startsWith('pt'))
    const sel      = voice === 'feminina'
      ? (ptVoices.find(v => /female|feminino/i.test(v.name)) ?? ptVoices[0])
      : (ptVoices.find(v => /male|masculino/i.test(v.name))  ?? ptVoices[ptVoices.length-1] ?? ptVoices[0])
    if (sel) utter.voice = sel
    utter.onend   = () => setSpeaking(null)
    utter.onerror = () => setSpeaking(null)
    setSpeaking(idx)
    synthRef.current.speak(utter)
  }

  const speakAll = () => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    if (speaking === -1) { setSpeaking(null); return }
    setSpeaking(-1)
    const fullText = advices.map((a, i) => `${i+1}. ${a.title}. ${a.message} ${a.action}`).join(' ... ')
    const utter    = new SpeechSynthesisUtterance(fullText)
    utter.lang     = 'pt-BR'; utter.rate = 1.0
    utter.pitch    = voice === 'feminina' ? 1.2 : 0.85
    const voices   = synthRef.current.getVoices()
    const ptVoices = voices.filter(v => v.lang.startsWith('pt'))
    const sel      = voice === 'feminina'
      ? (ptVoices.find(v => /female|feminino/i.test(v.name)) ?? ptVoices[0])
      : (ptVoices.find(v => /male|masculino/i.test(v.name))  ?? ptVoices[ptVoices.length-1])
    if (sel) utter.voice = sel
    utter.onend   = () => setSpeaking(null)
    utter.onerror = () => setSpeaking(null)
    synthRef.current.speak(utter)
  }

  const startVoiceQuestion = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'pt-BR'; rec.continuous = false; rec.interimResults = false
    recogRef.current = rec
    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)
    rec.onresult = (e: any) => { setQuestion(e.results[0][0].transcript) }
    rec.start()
  }

  const [receiveAudio, setReceiveAudio] = useState(true)
  useEffect(() => {
    fetch('/api/pf/advisor/schedule').then(r => r.json()).then(d => {
      if (d && d.receive_audio === false) setReceiveAudio(false)
    })
  }, [])

  const pitch        = voice === 'feminina' ? 1.2 : 0.85
  const highPriority = advices.filter(a => a.priority === 'high')
  const rest         = advices.filter(a => a.priority !== 'high')
  const allAdvices   = [...highPriority, ...rest]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Consultor IA</h2>
          </div>
          <p className="text-gray-400 text-sm">Seu Consultor Financeiro Pessoal com IA</p>
          {genAt && <p className="text-[10px] text-gray-600 mt-0.5">Gerado em {new Date(genAt).toLocaleString('pt-BR')}</p>}
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1">
            {(['feminina','masculina'] as const).map(v => (
              <button key={v} onClick={() => setVoice(v)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${voice===v ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {VOICE_LABEL[v]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {advices.length > 0 && (
              <button onClick={speakAll}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${speaking===-1 ? 'bg-emerald-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                {speaking===-1 ? <VolumeX size={13}/> : <Volume2 size={13}/>} Ouvir tudo
              </button>
            )}
            <button onClick={() => load()} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Resumo financeiro rápido */}
      {context && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Receitas</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(context.receitas)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Gastos</p>
            <p className="text-sm font-bold text-red-400">{formatCurrency(context.despesas)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Resultado</p>
            <p className={`text-sm font-bold ${context.resultado>=0?'text-white':'text-red-400'}`}>{formatCurrency(context.resultado)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-0.5">Patrimônio</p>
            <p className="text-sm font-bold text-yellow-400">{formatCurrency(context.patrimonio)}</p>
          </div>
        </div>
      )}

      {/* Áudios — Semana e Mês */}
      {receiveAudio && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 size={14} className="text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Orientações em Áudio · máx. 5 min · direto ao ponto</h3>
          </div>
          <AudioCard
            title="Orientação da Semana"
            icon={Calendar}
            iconColor="text-blue-400"
            endpoint="/api/pf/advisor/weekly"
            voice={voice}
            pitch={pitch}
          />
          <AudioCard
            title="Orientação do Mês"
            icon={CalendarDays}
            iconColor="text-purple-400"
            endpoint="/api/pf/advisor/monthly"
            voice={voice}
            pitch={pitch}
          />
        </div>
      )}

      {/* Erro de config */}
      {error && error.includes('ANTHROPIC_API_KEY') && (
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-5 mb-6">
          <p className="text-yellow-300 font-bold mb-2 flex items-center gap-2">
            <AlertTriangle size={16}/> Chave de IA não encontrada neste deploy
          </p>
          <p className="text-yellow-400 text-sm mb-3">
            A variável <code className="text-yellow-200 font-mono">ANTHROPIC_API_KEY</code> foi adicionada no Vercel mas o deploy atual ainda não a possui.
          </p>
          <p className="text-yellow-400 text-sm font-semibold">Como resolver:</p>
          <ol className="text-yellow-400 text-sm mt-1 space-y-1 list-decimal list-inside">
            <li>Acesse <strong className="text-yellow-300">vercel.com</strong> → seu projeto</li>
            <li>Vá em <strong className="text-yellow-300">Deployments</strong></li>
            <li>Clique nos 3 pontinhos do último deploy → <strong className="text-yellow-300">Redeploy</strong></li>
          </ol>
        </div>
      )}
      {error && !error.includes('ANTHROPIC_API_KEY') && (
        <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Analisando suas finanças...</p>
              <p className="text-gray-500 text-xs">O consultor está preparando suas orientações personalizadas</p>
            </div>
          </div>
          {[...Array(3)].map((_,i) => <div key={i} className="h-36 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />)}
        </div>
      )}

      {/* Cards de orientação */}
      {!loading && allAdvices.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Orientações do dia</h3>
          </div>
          {allAdvices.map((advice, i) => {
            const cfg  = TYPE_CONFIG[advice.type] ?? TYPE_CONFIG.tip
            const Icon = cfg.icon
            const idx  = advices.indexOf(advice)
            return (
              <div key={i} className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={20} className={cfg.iconColor} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
                        {advice.priority === 'high' && (
                          <span className="text-[10px] bg-red-900 text-red-300 px-2 py-0.5 rounded-full font-semibold">URGENTE</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">{advice.title}</h3>
                      <p className="text-sm text-gray-300 leading-relaxed mb-3">{advice.message}</p>
                      {advice.action && (
                        <div className="bg-black/20 rounded-xl px-4 py-2.5 border border-white/5">
                          <p className="text-xs text-gray-400 mb-0.5 font-semibold uppercase tracking-wide">Ação recomendada</p>
                          <p className="text-sm text-white font-medium">{advice.action}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => speak(`${advice.title}. ${advice.message}. Ação recomendada: ${advice.action}`, idx)}
                    className={`p-2 rounded-xl flex-shrink-0 transition-colors ${speaking===idx ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
                    {speaking===idx ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Campo de pergunta */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={15} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-gray-300">Pergunte ao Consultor</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Exemplos: "Como eliminar minhas dívidas em 12 meses?" · "Quanto preciso investir para ter R$ 1 milhão?" · "O que cortar para sobrar mais?"
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Digite sua pergunta financeira..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {question && (
              <button onClick={() => setQuestion('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={listening ? () => recogRef.current?.stop() : startVoiceQuestion}
            className={`px-3 py-3 rounded-xl transition-colors ${listening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
            {listening ? <MicOff size={16}/> : <Mic size={16}/>}
          </button>
          <button onClick={handleAsk} disabled={asking || !question.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {asking ? <RefreshCw size={15} className="animate-spin"/> : <Send size={15}/>}
            {asking ? 'Consultando...' : 'Perguntar'}
          </button>
        </div>
      </div>
    </div>
  )
}
