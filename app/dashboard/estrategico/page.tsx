'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'

// ─── tipos ────────────────────────────────────────────────────────────────────
interface BUData {
  bu: string; label: string; bruto: number; liquido: number
  vendas: number; produtos: number; meta: number; pct: number
}
interface ProdutoData { nome: string; vendas: number; bruto: number; bu: string }
interface EvolucaoData { mes: string; bruto: number; liquido: number }
interface ApiData {
  totalBruto: number; totalLiquido: number; totalVendas: number
  metaAbril: number; bus: BUData[]; topProdutos: ProdutoData[]; evolucao: EvolucaoData[]
}

// ─── constantes ───────────────────────────────────────────────────────────────
const BU_CORES: Record<string, string> = {
  empresario: '#3b82f6', nutricao: '#10b981', gastro: '#f97316',
  beleza: '#ec4899', mid: '#8b5cf6', outros: '#f59e0b',
}

const MESES: Record<string, string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez',
}
function mesLabel(m: string) {
  const [y, mo] = m.split('-')
  return `${MESES[mo]}/${y.slice(2)}`
}

const PLANO = [
  { semana: 'S1 — Esta Semana', cor: '#ef4444', prioridade: 'CRITICA', acoes: [
    { texto: 'Reconstruir pagina E-book Precificacao (CVR 1% -> 6%)', resp: '@cro-specialist + @copywriter', meta: 'CPV R$100 -> R$30' },
    { texto: 'Criar 5 novos angulos de criativo para Precificacao', resp: '@creative-director', meta: 'CTR acima de 3%' },
    { texto: 'Analisar copy atual da pagina Precificacao', resp: '@copywriter', meta: 'Diagnostico completo' },
  ]},
  { semana: 'S2 — Semana que vem', cor: '#f97316', prioridade: 'CRITICA', acoes: [
    { texto: 'Ativar funil Nutricao: pagina Desinche + 3 criativos', resp: '@copywriter + @creative-director', meta: '2o motor ON' },
    { texto: 'Criar upsell R$197 entre Pacote R$87 e Empresario R$247', resp: '@offer-engineer', meta: 'Fechar gap esteira' },
  ]},
  { semana: 'S3 — Em 2 semanas', cor: '#f59e0b', prioridade: 'ALTA', acoes: [
    { texto: 'Estruturar funil perpetuo MID (sem depender de lancamento)', resp: '@launch-strategist + @vibe-coder', meta: 'Receita diaria MID' },
    { texto: 'Ativar 2 produtos recorrentes (Nutricao) com funil proprio', resp: '@cro-specialist', meta: '+MRR mensal' },
  ]},
  { semana: 'S4 — Em 3 semanas', cor: '#3b82f6', prioridade: 'MEDIA', acoes: [
    { texto: 'Gastronomia: pacote planilhas + Restaurante Master com trafego', resp: '@copywriter + @vibe-coder', meta: 'Nicho ativo' },
    { texto: 'Beleza: reconstruir pagina Salao Lucrativo + criativo', resp: '@creative-director', meta: 'BU Beleza ativa' },
  ]},
  { semana: 'S5-6 — Automacao e Escala', cor: '#8b5cf6', prioridade: 'MEDIA', acoes: [
    { texto: 'Sequencia pos-compra e-mail + WhatsApp', resp: '@automation-architect', meta: 'LTV +40%' },
    { texto: 'Aumentar budget para R$20k nas campanhas vencedoras', resp: '@analyst', meta: 'Escala controlada' },
  ]},
  { semana: 'S7-8 — Lancamento e Revisao', cor: '#10b981', prioridade: 'ESCALA', acoes: [
    { texto: 'Lancamento MDV / Evento online estruturado', resp: '@launch-strategist', meta: 'Pico de receita' },
    { texto: 'Analise completa + roadmap Q2/Q3', resp: 'Time completo', meta: 'Meta Q2: R$175k/mes' },
  ]},
]

const EQUIPE = [
  { sigla: 'CD', nome: '@creative-director', desc: 'Direcao criativa, angulos de ads por BU', cor: '#3b82f6', dept: 'Marketing' },
  { sigla: 'GH', nome: '@growth-hacker',     desc: 'Algoritmos Meta, CTR, formatos virais',   cor: '#10b981', dept: 'Marketing' },
  { sigla: 'CW', nome: '@copywriter',         desc: 'Copy de paginas, VSLs, e-mails, scripts', cor: '#8b5cf6', dept: 'Marketing' },
  { sigla: 'CR', nome: '@cro-specialist',     desc: 'Funis, A/B testing, otimizacao de conversao', cor: '#ec4899', dept: 'Marketing' },
  { sigla: 'OE', nome: '@offer-engineer',     desc: 'Stack de valor, bumps, upsells, garantias', cor: '#f97316', dept: 'Produto' },
  { sigla: 'LS', nome: '@launch-strategist',  desc: 'Eventos online, cronograma, captacao',    cor: '#f59e0b', dept: 'Produto' },
  { sigla: 'PM', nome: '@pm',                 desc: 'Roadmap, priorizacao, sprints',            cor: '#3b82f6', dept: 'Produto' },
  { sigla: 'AN', nome: '@analyst',            desc: 'ROI, CAC, LTV, metricas por BU',          cor: '#10b981', dept: 'Inteligencia' },
  { sigla: 'MI', nome: '@market-intel',       desc: 'Concorrentes, tendencias, avatar',         cor: '#8b5cf6', dept: 'Inteligencia' },
  { sigla: 'VC', nome: '@vibe-coder',         desc: 'Paginas, integracoes, performance tecnica', cor: '#ec4899', dept: 'Tech' },
  { sigla: 'AA', nome: '@automation-architect', desc: 'E-mail flows, WhatsApp, funis automaticos', cor: '#f97316', dept: 'Tech' },
]

const ESTEIRAS = [
  {
    titulo: 'Esteira Empresario', emoji: '🏢', cor: '#3b82f6',
    desc: 'Financas, precificacao, gestao empresarial',
    status: 'ativo', statusLabel: 'Ativa — precisa de escala',
    passos: [
      { label: 'E-book R$27,90', sub: 'Front-end #1', cor: '#3b82f6', ativo: true },
      { label: 'Pacote R$87,90', sub: 'Order Bump 84%', cor: '#10b981', ativo: true },
      { label: 'R$247', sub: 'Empresario Lucrativo', cor: '#f59e0b', ativo: false },
      { label: 'R$297', sub: 'Combo Expert', cor: '#f59e0b', ativo: false },
      { label: 'R$497', sub: 'LFE', cor: '#f59e0b', ativo: false },
      { label: 'R$997', sub: 'COLISEUM', cor: '#ec4899', ativo: false },
      { label: 'R$1.997', sub: 'Fin. Sem Caos', cor: '#ec4899', ativo: false },
    ],
    insight: 'Esteira mais madura — precisa de escala com CPV menor',
    insightType: 'success' as const,
  },
  {
    titulo: 'Esteira Nutricao', emoji: '🥗', cor: '#10b981',
    desc: 'Emagrecimento, saude hormonal feminina',
    status: 'dormente', statusLabel: 'INATIVA — 2o motor desligado',
    passos: [
      { label: '12 ebooks R$27,90', sub: 'Front-ends dormentes', cor: '#6b7280', ativo: false },
      { label: 'Desinche R$47,90', sub: 'Front-end principal', cor: '#6b7280', ativo: false },
      { label: 'Volte p/ Roupas R$87,90', sub: 'Upsell', cor: '#6b7280', ativo: false },
      { label: 'BARRIGA OFF R$147', sub: 'Curso principal', cor: '#6b7280', ativo: false },
      { label: 'R$224/mes', sub: 'Corpo Leve (recorrente)', cor: '#6b7280', ativo: false },
    ],
    insight: 'TODA a esteira esta desligada — 2o motor de receita completamente inativo',
    insightType: 'danger' as const,
  },
  {
    titulo: 'Esteira MID — Mentoria Digital', emoji: '🧠', cor: '#8b5cf6',
    desc: 'Para profissionais que querem vender no digital',
    status: 'parcial', statusLabel: 'Parcial — depende de lancamento',
    passos: [
      { label: 'Front-end R$27-47', sub: 'Ebooks MID', cor: '#8b5cf6', ativo: true },
      { label: 'EVENTO', sub: 'Lancamento online', cor: '#f59e0b', ativo: true },
      { label: 'MID R$697', sub: 'Mentoria entrada', cor: '#10b981', ativo: true },
      { label: 'MID Pro R$2.997', sub: 'Mentoria premium', cor: '#10b981', ativo: true },
      { label: 'Imperium R$6.997', sub: 'Alto ticket', cor: '#ec4899', ativo: false },
    ],
    insight: 'MID Pro ja vende mas depende de lancamento manual — criar funil perpetuo',
    insightType: 'warning' as const,
  },
  {
    titulo: 'Esteira MDV — Destrave Sua Vida', emoji: '💫', cor: '#f59e0b',
    desc: 'Desbloqueio financeiro e relacionamentos',
    status: 'parcial', statusLabel: 'Parcial — evento dependente',
    passos: [
      { label: 'R$27,90', sub: 'Desafio / Reamar', cor: '#3b82f6', ativo: true },
      { label: 'EVENTO', sub: 'Destrave / Reconexao', cor: '#f59e0b', ativo: true },
      { label: 'MDV R$1.997', sub: 'Mentoria principal', cor: '#ec4899', ativo: true },
      { label: 'R$6.997', sub: 'Virada Emocional', cor: '#ec4899', ativo: true },
    ],
    insight: 'Virada Emocional ja vendeu R$6.997 — potencial alto com evento estruturado',
    insightType: 'info' as const,
  },
  {
    titulo: 'Esteira Gastronomia', emoji: '🍽️', cor: '#f97316',
    desc: 'Gestao de restaurantes e food service',
    status: 'parcial', statusLabel: 'Parcial — trafego baixo',
    passos: [
      { label: 'Planilhas R$47,90', sub: 'Precificacao (4 nichos)', cor: '#f97316', ativo: true },
      { label: 'iFood R$27,90', sub: 'Ebook especifico', cor: '#6b7280', ativo: false },
      { label: 'Rest. Master R$97,90', sub: 'Curso principal', cor: '#f97316', ativo: true },
    ],
    insight: 'Nicho especifico com potencial — precisa de trafego dedicado',
    insightType: 'warning' as const,
  },
]

const METAS_MENSAIS = [
  { mes: 'Abril 2026', meta: 100000, cor: '#f59e0b', status: 'Em execucao', desc: 'Otimizar CPV + ativar Nutricao' },
  { mes: 'Maio 2026',  meta: 135000, cor: '#3b82f6', status: 'Em planejamento', desc: 'Ativar Nutricao + MID perpetuo' },
  { mes: 'Junho 2026', meta: 175000, cor: '#8b5cf6', status: 'Em planejamento', desc: 'Todas BUs ativas + escala' },
]

const METAS_BU = [
  { bu: 'empresario', label: 'Empresario', emoji: '🏢', meta: 55000,  cor: '#3b82f6', alerta: null },
  { bu: 'nutricao',   label: 'Nutricao',   emoji: '🥗', meta: 20000,  cor: '#10b981', alerta: 'Motor desligado — ativar urgente' },
  { bu: 'mid',        label: 'MID / MDV',   emoji: '🧠', meta: 15000,  cor: '#8b5cf6', alerta: null },
  { bu: 'gastro',     label: 'Gastronomia', emoji: '🍽️', meta: 5000,   cor: '#f97316', alerta: null },
  { bu: 'beleza',     label: 'Beleza',      emoji: '💅', meta: 3000,   cor: '#ec4899', alerta: 'Sem trafego ativo' },
  { bu: 'outros',     label: 'Eventos',     emoji: '🚀', meta: 2000,   cor: '#f59e0b', alerta: null },
]

const TABS = ['Visao Geral', 'Metas & BUs', 'Produtos', 'Esteiras', 'Equipe', 'Plano de Acao'] as const
type Tab = typeof TABS[number]

// ─── componentes auxiliares ───────────────────────────────────────────────────
function KPI({ label, value, sub, cor }: { label: string; value: string; sub?: string; cor?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-2xl font-black leading-none ${cor ? '' : 'text-white'}`} style={cor ? { color: cor } : {}}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

function KPIDual({ label, atual, meta, atualLabel, metaLabel, corAtual, corMeta }: {
  label: string; atual: string; meta: string; atualLabel: string; metaLabel: string; corAtual: string; corMeta: string
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</div>
      <div className="flex items-end gap-3">
        <div>
          <div className="text-2xl font-bold" style={{ color: corAtual }}>{atual}</div>
          <div className="text-xs text-gray-500">{atualLabel}</div>
        </div>
        <div className="text-gray-600 text-xl pb-1">→</div>
        <div>
          <div className="text-2xl font-bold" style={{ color: corMeta }}>{meta}</div>
          <div className="text-xs text-gray-500">{metaLabel}</div>
        </div>
      </div>
    </div>
  )
}

function Progress({ label, atual, meta, cor, alerta }: { label: string; atual: number; meta: number; cor: string; alerta?: string | null }) {
  const pct = Math.min(100, meta > 0 ? Math.round((atual / meta) * 100) : 0)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">{formatCurrency(atual)} / {formatCurrency(meta)}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cor }} />
      </div>
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs text-gray-500">{pct}% da meta</div>
        {pct >= 100 && <div className="text-xs text-emerald-400 font-semibold">Meta atingida!</div>}
      </div>
      {alerta && pct < 50 && (
        <div className="text-xs text-red-400 mt-1">⚠ {alerta}</div>
      )}
    </div>
  )
}

// ─── pagina principal ─────────────────────────────────────────────────────────
export default function EstrategicoPage() {
  const [data,    setData]    = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [tab,     setTab]     = useState<Tab>('Visao Geral')
  const [buFiltro, setBuFiltro] = useState('todos')

  // simulador
  const [budget, setBudget] = useState(10000)
  const [cpv,    setCpv]    = useState(30)
  const [arpu,   setArpu]   = useState(105)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    fetch('/api/estrategico')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-64 bg-gray-800 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  if (error) return (
    <div className="bg-red-950 border border-red-700 rounded-xl p-6 text-red-300">
      <div className="font-bold mb-1">Erro ao carregar dados estrategicos</div>
      <div className="text-sm">{error}</div>
      <button onClick={load} className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm">
        Tentar novamente
      </button>
    </div>
  )

  const d = data!
  const metaAbril = 100000
  const pctMeta   = Math.round((d.totalBruto / metaAbril) * 100)
  const simVendas = Math.round(budget / cpv)
  const simFat    = simVendas * arpu
  const simROI    = simFat / budget

  // KPIs calculados
  const ticketMedio = d.totalVendas > 0 ? d.totalBruto / d.totalVendas : 0
  const margemLiquida = d.totalBruto > 0 ? ((d.totalLiquido / d.totalBruto) * 100) : 0
  const busAtivas = d.bus.filter(b => b.bruto > 0).length

  // Produtos filtrados
  const prodsFiltrados = buFiltro === 'todos'
    ? d.topProdutos
    : d.topProdutos.filter(p => p.bu === buFiltro)

  // Projecao por BU para grafico
  const projecaoBU = [
    { mes: 'Mar/26', empresario: 25000, nutricao: 800, mid: 42000, gastro: 1600, beleza: 0, eventos: 0 },
    { mes: 'Abr/26', empresario: 55000, nutricao: 20000, mid: 15000, gastro: 5000, beleza: 3000, eventos: 2000 },
    { mes: 'Mai/26', empresario: 65000, nutricao: 30000, mid: 25000, gastro: 8000, beleza: 5000, eventos: 2000 },
    { mes: 'Jun/26', empresario: 75000, nutricao: 40000, mid: 35000, gastro: 12000, beleza: 8000, eventos: 5000 },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Painel Estrategico</h2>
          <p className="text-gray-400 text-sm mt-1">
            Estrutura empresarial · 6 BUs · 73 produtos · Meta Abril R$ 100k
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dados ao vivo</span>
          </div>
          <button onClick={load}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold text-white transition-colors">
            ↻ Atualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ═══ VISAO GERAL ══════════════════════════════════════════════════════ */}
      {tab === 'Visao Geral' && (
        <div className="space-y-6">
          {/* KPIs Principais — 4 colunas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 border-l-4 border-l-emerald-500">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Faturamento Bruto 2026</div>
              <div className="text-3xl font-black text-emerald-400">{formatCurrency(d.totalBruto)}</div>
              <div className="mt-2">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pctMeta}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{pctMeta}% da meta Abril</div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 border-l-4 border-l-blue-500">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Meta Abril 2026</div>
              <div className="text-3xl font-black text-blue-400">{formatCurrency(metaAbril)}</div>
              <div className="text-xs text-gray-500 mt-2">
                Gap: {formatCurrency(Math.max(0, metaAbril - d.totalBruto))}
              </div>
            </div>
            <KPIDual label="ROI Atual → Meta" atual="2,5x" meta="4,0x" atualLabel="atual" metaLabel="meta" corAtual="#ef4444" corMeta="#10b981" />
            <KPIDual label="Custo por Venda" atual="R$ 100" meta="R$ 8" atualLabel="atual (pior)" metaLabel="meta" corAtual="#ef4444" corMeta="#10b981" />
          </div>

          {/* KPIs Secundarios — 6 colunas */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPI label="Total de Vendas 2026"    value={String(d.totalVendas)} sub="transacoes aprovadas" />
            <KPI label="Ticket Medio"            value={formatCurrency(ticketMedio)} sub={`ARPU low-ticket: R$ 105`} />
            <KPI label="Margem Liquida"          value={`${margemLiquida.toFixed(1)}%`} cor="#10b981" sub="produto digital puro" />
            <KPI label="Taxa de Reembolso"       value="0,16%" cor="#10b981" sub="alta satisfacao" />
            <KPI label="Order Bump Rate"         value="84%" cor="#f59e0b" sub="Pacote Empresario Master" />
            <KPI label="Produtos Ativos"         value={`22 / 73`} sub="51 dormentes = oportunidade" cor="#ef4444" />
          </div>

          {/* Evolucao */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Evolucao de Faturamento 2026</h3>
              <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded-full">
                Meta R$ 100k/mes
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={d.evolucao.map(e => ({ ...e, label: mesLabel(e.mes) }))}>
                <defs>
                  <linearGradient id="gB2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gL2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v: any, name: any) => [formatCurrency(Number(v)), name === 'bruto' ? 'Bruto' : 'Liquido']} />
                <Legend formatter={v => v === 'bruto' ? 'Bruto' : 'Liquido'} />
                <Area type="monotone" dataKey="bruto"   stroke="#10b981" fill="url(#gB2)" strokeWidth={2} name="bruto" />
                <Area type="monotone" dataKey="liquido" stroke="#3b82f6" fill="url(#gL2)" strokeWidth={2} name="liquido" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* BU + Produtos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold text-white mb-4">Faturamento por BU</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={d.bus.filter(b => b.bruto > 0)} dataKey="bruto" nameKey="label"
                    cx="50%" cy="42%" outerRadius={85}
                    label={({ name, value, percent }: any) =>
                      `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: '#4b5563', strokeWidth: 1 }}>
                    {d.bus.filter(b => b.bruto > 0).map((b, i) => (
                      <Cell key={i} fill={BU_CORES[b.bu] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Bruto']} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} formatter={(v: any) => v} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold text-white mb-4">Top 8 Produtos por Faturamento</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.topProdutos.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: '#9ca3af', fontSize: 9 }} width={130}
                    tickFormatter={(v: any) => v.length > 22 ? v.substring(0, 22) + '...' : v} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(v: any) => [formatCurrency(Number(v)), 'Bruto']} />
                  <Bar dataKey="bruto" radius={[0, 4, 4, 0]}>
                    {d.topProdutos.slice(0, 8).map((p, i) => (
                      <Cell key={i} fill={BU_CORES[p.bu] ?? '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forma de Pagamento (hardcoded do estatico) */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-semibold text-white mb-4">Forma de Pagamento</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Pix', pct: 85, cor: '#10b981', qtd: 431 },
                { label: 'Visa', pct: 6, cor: '#3b82f6', qtd: 32 },
                { label: 'Mastercard', pct: 6, cor: '#8b5cf6', qtd: 30 },
                { label: 'Boleto', pct: 2, cor: '#f59e0b', qtd: 11 },
                { label: 'Outros', pct: 1, cor: '#6b7280', qtd: 4 },
              ].map(p => (
                <div key={p.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold" style={{ color: p.cor }}>{p.pct}%</div>
                  <div className="text-xs text-gray-400">{p.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.qtd} vendas</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ METAS & BUs ══════════════════════════════════════════════════════ */}
      {tab === 'Metas & BUs' && (
        <div className="space-y-6">
          {/* Metas mensais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {METAS_MENSAIS.map(m => (
              <div key={m.mes} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Meta {m.mes}</div>
                <div className="text-3xl font-black mb-1" style={{ color: m.cor }}>{formatCurrency(m.meta)}</div>
                <div className="text-xs text-gray-500 mb-3">{m.desc}</div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all" style={{
                    width: m.mes === 'Abril 2026' ? `${pctMeta}%` : '0%',
                    background: m.cor
                  }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{m.status}</span>
                  {m.mes === 'Abril 2026' && (
                    <span className="text-gray-400">{pctMeta}% — gap de {formatCurrency(Math.max(0, m.meta - d.totalBruto))}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Projecao por BU - Grafico */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-semibold text-white mb-4">Projecao de Crescimento por BU</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={projecaoBU}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v: any) => [formatCurrency(Number(v))]} />
                <Legend />
                <Bar dataKey="empresario" name="Empresario" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="nutricao" name="Nutricao" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="mid" name="MID/MDV" fill="#8b5cf6" radius={[4,4,0,0]} />
                <Bar dataKey="gastro" name="Gastronomia" fill="#f97316" radius={[4,4,0,0]} />
                <Bar dataKey="beleza" name="Beleza" fill="#ec4899" radius={[4,4,0,0]} />
                <Bar dataKey="eventos" name="Eventos" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progresso por BU com alertas */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold text-white mb-6">Metas por BU — Abril</h3>
              <div className="space-y-5">
                {METAS_BU.map(item => {
                  const buData = d.bus.find(b => b.bu === item.bu)
                  const atual = buData?.bruto ?? 0
                  const pctBu = Math.min(100, item.meta > 0 ? Math.round((atual / item.meta) * 100) : 0)
                  return (
                    <div key={item.bu}>
                      <Progress
                        label={`${item.emoji} ${item.label}`}
                        atual={atual}
                        meta={item.meta}
                        cor={item.cor}
                        alerta={item.alerta}
                      />
                      {pctBu >= 100 && (
                        <div className="text-xs text-emerald-400 mt-1 font-semibold">
                          Meta atingida — estruturar perpetuo
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Simulador */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold text-white mb-6">Simulador de ROI</h3>
              <div className="space-y-5">
                {[
                  { label: 'Budget Mensal', min: 5000,  max: 50000, step: 1000, val: budget, set: setBudget, fmt: (v: number) => formatCurrency(v), accent: 'accent-blue-500' },
                  { label: 'CPV Alvo (R$)', min: 5,     max: 100,   step: 1,    val: cpv,    set: setCpv,    fmt: (v: number) => `R$ ${v}`, accent: 'accent-emerald-500' },
                  { label: 'ARPU (R$)',     min: 30,    max: 300,   step: 5,    val: arpu,   set: setArpu,   fmt: (v: number) => `R$ ${v}`, accent: 'accent-yellow-500' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="text-white font-bold">{s.fmt(s.val)}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                      onChange={e => s.set(Number(e.target.value))}
                      className={`w-full ${s.accent}`} />
                    <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                      <span>{s.fmt(s.min)}</span>
                      <span>{s.fmt(s.max)}</span>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: 'Vendas/mes',   value: simVendas.toLocaleString('pt-BR'), cor: 'text-white' },
                    { label: 'Faturamento',  value: formatCurrency(simFat),            cor: 'text-emerald-400' },
                    { label: 'ROI',          value: `${simROI.toFixed(1)}x`,           cor: simROI >= 4 ? 'text-emerald-400' : simROI >= 2.5 ? 'text-yellow-400' : 'text-red-400' },
                  ].map(r => (
                    <div key={r.label} className="bg-gray-800 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-400 mb-1">{r.label}</div>
                      <div className={`text-xl font-black ${r.cor}`}>{r.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Para atingir R$ 100k/mes</div>
                  <div className="text-lg font-bold text-blue-400">
                    {formatCurrency(Math.ceil(100000 / arpu) * cpv)} de budget
                    {' '}ou {Math.ceil(100000 / arpu)} vendas/mes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PRODUTOS ════════════════════════════════════════════════════════ */}
      {tab === 'Produtos' && (
        <div className="space-y-4">
          {/* Resumo de produtos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <KPI label="Total Cadastrados" value="73" sub="produtos na Eduzz" />
            <KPI label="Ativos (com vendas)" value="22" cor="#10b981" sub="30% do catalogo" />
            <KPI label="Dormentes" value="51" cor="#ef4444" sub="oportunidade de ativacao" />
            <KPI label="Top 1 Produto" value={d.topProdutos[0]?.nome?.substring(0, 20) + '...' || '—'} sub={d.topProdutos[0] ? `${d.topProdutos[0].vendas} vendas` : ''} />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'empresario', label: '🏢 Empresario' },
              { id: 'nutricao',   label: '🥗 Nutricao' },
              { id: 'gastro',     label: '🍽️ Gastronomia' },
              { id: 'mid',        label: '🧠 MID/MDV' },
              { id: 'beleza',     label: '💅 Beleza' },
            ].map(f => (
              <button key={f.id} onClick={() => setBuFiltro(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  buFiltro === f.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Produto</th>
                  <th className="text-left px-4 py-3">BU</th>
                  <th className="text-right px-4 py-3">Vendas</th>
                  <th className="text-right px-4 py-3">Faturamento</th>
                  <th className="text-right px-4 py-3">Ticket Medio</th>
                  <th className="text-right px-4 py-3">% Total</th>
                </tr>
              </thead>
              <tbody>
                {prodsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                      Nenhuma venda encontrada para esta BU no periodo
                    </td>
                  </tr>
                ) : prodsFiltrados.map((p, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-white max-w-xs">
                      <span className="truncate block" title={p.nome}>{p.nome}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ background: `${BU_CORES[p.bu] ?? '#64748b'}20`, color: BU_CORES[p.bu] ?? '#94a3b8' }}>
                        {p.bu}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{p.vendas}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{formatCurrency(p.bruto)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{p.vendas > 0 ? formatCurrency(p.bruto / p.vendas) : '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {d.totalBruto > 0 ? `${((p.bruto / d.totalBruto) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ESTEIRAS ════════════════════════════════════════════════════════ */}
      {tab === 'Esteiras' && (
        <div className="space-y-6">
          {/* Resumo das esteiras */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {ESTEIRAS.map(e => (
              <div key={e.titulo} className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center"
                style={{ borderTop: `3px solid ${e.cor}` }}>
                <div className="text-lg mb-1">{e.emoji}</div>
                <div className="text-xs font-bold text-white">{e.titulo.replace('Esteira ', '')}</div>
                <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                  e.status === 'ativo' ? 'bg-emerald-950 text-emerald-400' :
                  e.status === 'dormente' ? 'bg-red-950 text-red-400' :
                  'bg-yellow-950 text-yellow-400'
                }`}>{e.status}</div>
              </div>
            ))}
          </div>

          {/* Funis visuais — layout horizontal completo */}
          <div className="space-y-6">
            {ESTEIRAS.map(e => (
              <div key={e.titulo} className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                style={{ borderTop: `3px solid ${e.cor}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">{e.emoji} {e.titulo}</h3>
                    <div className="text-xs text-gray-400 mt-0.5">{e.desc}</div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    e.status === 'ativo' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    e.status === 'dormente' ? 'bg-red-950 text-red-400 border border-red-800' :
                    'bg-yellow-950 text-yellow-400 border border-yellow-800'
                  }`}>{e.statusLabel}</span>
                </div>

                {/* Funil horizontal */}
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-2 min-w-max py-2">
                    {e.passos.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="rounded-xl px-4 py-3 text-center min-w-[120px]"
                          style={{
                            background: p.ativo ? `${p.cor}15` : '#1f293740',
                            border: `1px solid ${p.ativo ? `${p.cor}50` : '#374151'}`,
                          }}>
                          <div className="text-base font-bold" style={{ color: p.ativo ? p.cor : '#6b7280' }}>{p.label}</div>
                          <div className="text-xs mt-1" style={{ color: p.ativo ? '#d1d5db' : '#4b5563' }}>
                            {p.sub}
                          </div>
                          {!p.ativo && <div className="text-xs text-red-400 font-semibold mt-1">OFF</div>}
                        </div>
                        {i < e.passos.length - 1 && (
                          <div className="text-gray-500 text-xl font-bold">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insight */}
                <div className={`mt-4 p-3 rounded-lg text-xs ${
                  e.insightType === 'success' ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' :
                  e.insightType === 'danger' ? 'bg-red-950 border border-red-800 text-red-300' :
                  e.insightType === 'warning' ? 'bg-yellow-950 border border-yellow-800 text-yellow-300' :
                  'bg-blue-950 border border-blue-800 text-blue-300'
                }`}>
                  {e.insightType === 'success' && '✓ '}
                  {e.insightType === 'danger' && '✗ '}
                  {e.insightType === 'warning' && '⚡ '}
                  {e.insightType === 'info' && '→ '}
                  {e.insight}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ EQUIPE ══════════════════════════════════════════════════════════ */}
      {tab === 'Equipe' && (
        <div className="space-y-6">
          {/* CEO */}
          <div className="bg-gray-900 rounded-xl p-6 border-2 border-yellow-600/40 shadow-lg shadow-yellow-900/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>VL</div>
              <div>
                <div className="text-lg font-bold text-white">Valter Leite</div>
                <div className="text-sm text-gray-400">CEO · Product Owner · Decisor Final</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['Visao Estrategica','Aprovacoes','Parcerias BU','Decisoes Irreversiveis'].map(t => (
                    <span key={t} className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-950 text-yellow-400 border border-yellow-800">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Time por departamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {['Marketing', 'Produto', 'Inteligencia', 'Tech'].map(dept => (
              <div key={dept} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{dept}</h3>
                <div className="space-y-3">
                  {EQUIPE.filter(m => m.dept === dept).map(m => (
                    <div key={m.nome} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: m.cor }}>{m.sigla}</div>
                      <div>
                        <div className="font-semibold text-white text-sm">{m.nome}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* BUs */}
          <div>
            <h3 className="font-bold text-white mb-4">Unidades de Negocio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                { bu: 'empresario', label: '🏢 Empresario',      nicho: 'Financas, precificacao, gestao',           parceria: '—',               status: 'Ativo',    cor: '#3b82f6', prods: 16 },
                { bu: 'nutricao',   label: '🥗 Saude & Nutricao', nicho: 'Emagrecimento, saude hormonal feminina',   parceria: 'Socia nutricionista', status: 'Dormente', cor: '#10b981', prods: 20 },
                { bu: 'gastro',     label: '🍽️ Gastronomia',     nicho: 'Gestao de restaurantes e food service',    parceria: 'Socio restaurateur', status: 'Parcial',  cor: '#f97316', prods: 6 },
                { bu: 'beleza',     label: '💅 Beleza',           nicho: 'Gestao de salao de beleza',                parceria: '—',               status: 'Dormente', cor: '#ec4899', prods: 1 },
                { bu: 'mid',        label: '🧠 MID / MDV',        nicho: 'Mentoria digital + Destrave sua vida',     parceria: '—',               status: 'Ativo',    cor: '#8b5cf6', prods: 22 },
                { bu: 'outros',     label: '🚀 Eventos Online',   nicho: 'Lancamentos que vendem as mentorias',      parceria: '—',               status: 'Sazonal',  cor: '#f59e0b', prods: 8 },
              ].map(b => {
                const buData = d.bus.find(x => x.bu === b.bu)
                return (
                  <div key={b.bu} className="bg-gray-900 rounded-xl p-5 border border-gray-800"
                    style={{ borderLeft: `3px solid ${b.cor}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{b.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        b.status === 'Ativo' ? 'bg-emerald-950 text-emerald-400' :
                        b.status === 'Dormente' ? 'bg-red-950 text-red-400' :
                        'bg-yellow-950 text-yellow-400'
                      }`}>{b.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{b.nicho}</div>
                    {b.parceria !== '—' && (
                      <div className="text-xs text-blue-400 mb-2">Parceria: {b.parceria}</div>
                    )}
                    <div className="flex justify-between text-sm mt-3">
                      <div>
                        <span className="text-gray-500">Produtos: </span>
                        <span className="text-white font-semibold">{b.prods}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fat. 2026: </span>
                        <span className="font-semibold" style={{ color: b.cor }}>
                          {buData ? formatCurrency(buData.bruto) : 'R$ 0'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PLANO DE ACAO ════════════════════════════════════════════════════ */}
      {tab === 'Plano de Acao' && (
        <div className="space-y-4">
          {/* KPIs do plano */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <KPI label="Tarefas Concluidas" value="0" cor="#ef4444" sub="de 14 acoes" />
            <KPI label="Total de Acoes"     value="14"        sub="em 8 semanas" cor="#f59e0b" />
            <KPI label="Semanas de Execucao" value="8"        sub="inicio imediato" cor="#3b82f6" />
            <KPI label="Meta ao Final"      value="R$ 175k"   sub="faturamento mensal" cor="#10b981" />
          </div>

          {/* Barra de progresso geral */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Progresso Geral do Plano</span>
              <span className="text-white font-semibold">0 / 14 acoes</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: '0%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>S1 — Critica</span>
              <span>S3-4 — Alta</span>
              <span>S5-6 — Media</span>
              <span>S7-8 — Escala</span>
            </div>
          </div>

          {/* Timeline */}
          {PLANO.map((s, si) => (
            <div key={si} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between"
                style={{ borderLeft: `4px solid ${s.cor}` }}>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{s.semana}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ background: `${s.cor}15`, color: s.cor, border: `1px solid ${s.cor}40` }}>
                    {s.prioridade}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{s.acoes.length} acoes</span>
              </div>
              <div className="divide-y divide-gray-800">
                {s.acoes.map((a, ai) => (
                  <div key={ai} className="px-5 py-3 hover:bg-gray-800/50 transition-colors">
                    <div className="text-sm text-white font-medium mb-1">{a.texto}</div>
                    <div className="flex gap-6 text-xs text-gray-500">
                      <span>Resp: {a.resp}</span>
                      <span>Meta: {a.meta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
