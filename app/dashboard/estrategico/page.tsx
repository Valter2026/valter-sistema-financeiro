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
  { semana: 'S1 — Esta Semana', cor: '#ef4444', prioridade: '🔴 CRÍTICA', acoes: [
    { texto: 'Reconstruir página E-book Precificação (CVR 1% → 6%)', resp: '@cro-specialist + @copywriter', meta: 'CPV R$100 → R$30' },
    { texto: 'Criar 5 novos ângulos de criativo para Precificação', resp: '@creative-director', meta: 'CTR acima de 3%' },
  ]},
  { semana: 'S2 — Semana que vem', cor: '#f97316', prioridade: '🔴 CRÍTICA', acoes: [
    { texto: 'Ativar funil Nutrição: página Desinche + 3 criativos', resp: '@copywriter + @creative-director', meta: '2º motor ON' },
    { texto: 'Criar upsell R$197 entre Pacote R$87 e Empresário R$247', resp: '@offer-engineer', meta: 'Fechar gap esteira' },
  ]},
  { semana: 'S3-4 — Em 2-3 semanas', cor: '#f59e0b', prioridade: '🟠 ALTA', acoes: [
    { texto: 'Funil perpétuo MID (sem depender de lançamento)', resp: '@launch-strategist', meta: 'Receita diária MID' },
    { texto: 'Ativar recorrentes Nutrição (Sessão + Corpo Leve)', resp: '@cro-specialist', meta: '+MRR mensal' },
    { texto: 'Gastronomia: pacote planilhas + Restaurante Master', resp: '@copywriter + @vibe-coder', meta: 'BU Gastro ativa' },
  ]},
  { semana: 'S5-6 — Automação e Escala', cor: '#3b82f6', prioridade: '🟡 MÉDIA', acoes: [
    { texto: 'Sequência pós-compra e-mail + WhatsApp', resp: '@automation-architect', meta: 'LTV +40%' },
    { texto: 'Aumentar budget para R$20k nas campanhas vencedoras', resp: '@analyst', meta: 'Escala controlada' },
  ]},
  { semana: 'S7-8 — Lançamento e Revisão', cor: '#10b981', prioridade: '🟢 ESCALA', acoes: [
    { texto: 'Lançamento MDV / Evento online estruturado', resp: '@launch-strategist', meta: 'Pico de receita' },
    { texto: 'Análise completa + roadmap Q2/Q3', resp: 'Time completo', meta: 'Meta Q2: R$175k/mês' },
  ]},
]

const EQUIPE = [
  { sigla: 'CD', nome: '@creative-director', desc: 'Direção criativa, ângulos de ads por BU', cor: '#3b82f6', dept: 'Marketing' },
  { sigla: 'GH', nome: '@growth-hacker',     desc: 'Algoritmos Meta, CTR, formatos virais',   cor: '#10b981', dept: 'Marketing' },
  { sigla: 'CW', nome: '@copywriter',         desc: 'Copy de páginas, VSLs, e-mails, scripts', cor: '#8b5cf6', dept: 'Marketing' },
  { sigla: 'CR', nome: '@cro-specialist',     desc: 'Funis, A/B testing, otimização de conversão', cor: '#ec4899', dept: 'Marketing' },
  { sigla: 'OE', nome: '@offer-engineer',     desc: 'Stack de valor, bumps, upsells, garantias', cor: '#f97316', dept: 'Produto' },
  { sigla: 'LS', nome: '@launch-strategist',  desc: 'Eventos online, cronograma, captação',    cor: '#f59e0b', dept: 'Produto' },
  { sigla: 'AN', nome: '@analyst',            desc: 'ROI, CAC, LTV, métricas por BU',          cor: '#10b981', dept: 'Inteligência' },
  { sigla: 'MI', nome: '@market-intel',       desc: 'Concorrentes, tendências, avatar',         cor: '#8b5cf6', dept: 'Inteligência' },
  { sigla: 'VC', nome: '@vibe-coder',         desc: 'Páginas, integrações, performance técnica', cor: '#ec4899', dept: 'Tech' },
  { sigla: 'AA', nome: '@automation-architect', desc: 'E-mail flows, WhatsApp, funis automáticos', cor: '#f97316', dept: 'Tech' },
]

const TABS = ['Visão Geral', 'Metas & BUs', 'Produtos', 'Esteiras', 'Equipe', 'Plano de Ação'] as const
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

function Progress({ label, atual, meta, cor }: { label: string; atual: number; meta: number; cor: string }) {
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
      <div className="text-xs text-gray-500 mt-1">{pct}% da meta</div>
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────
export default function EstrategicoPage() {
  const [data,    setData]    = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [tab,     setTab]     = useState<Tab>('Visão Geral')
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
      <div className="font-bold mb-1">Erro ao carregar dados estratégicos</div>
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

  // Produtos filtrados
  const prodsFiltrados = buFiltro === 'todos'
    ? d.topProdutos
    : d.topProdutos.filter(p => p.bu === buFiltro)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Painel Estratégico</h2>
          <p className="text-gray-400 text-sm mt-1">
            Estrutura empresarial · 6 BUs · 73 produtos · Meta Abril R$ 100k
          </p>
        </div>
        <button onClick={load}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold text-white transition-colors">
          ↻ Atualizar
        </button>
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

      {/* ═══ VISÃO GERAL ══════════════════════════════════════════════════════ */}
      {tab === 'Visão Geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Faturamento Bruto 2026"  value={formatCurrency(d.totalBruto)}   cor="#10b981" sub={`Meta Abr: ${formatCurrency(metaAbril)}`} />
            <KPI label="Faturamento Líquido"     value={formatCurrency(d.totalLiquido)} cor="#3b82f6" sub="após taxas da plataforma" />
            <KPI label="Progresso Meta Abril"    value={`${pctMeta}%`} cor={pctMeta >= 100 ? '#10b981' : pctMeta >= 60 ? '#f59e0b' : '#ef4444'} sub={`${formatCurrency(metaAbril - d.totalBruto)} para atingir`} />
            <KPI label="Total de Vendas 2026"    value={String(d.totalVendas)} sub="transações aprovadas" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="ROI Atual → Meta"    value="2,5x → 4,0x" sub="com CPV médio estimado" />
            <KPI label="Order Bump Rate"     value="84%" cor="#f59e0b" sub="Pacote Empresário Master" />
            <KPI label="ARPU Real Low-Ticket" value="R$ 105" cor="#8b5cf6" sub="ebook + order bump médio" />
            <KPI label="BUs Ativas"          value={`${d.bus.filter(b => b.bruto > 0).length} / 6`} sub="Nutrição e Beleza dormentes" />
          </div>

          {/* Evolução */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Evolução de Faturamento 2026</h3>
              <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded-full">
                Meta R$ 100k/mês
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
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
                  formatter={(v: any, name: any) => [formatCurrency(v), name === 'bruto' ? 'Bruto' : 'Líquido']} />
                <Legend formatter={v => v === 'bruto' ? 'Bruto' : 'Líquido'} />
                <Area type="monotone" dataKey="bruto"   stroke="#10b981" fill="url(#gB2)" strokeWidth={2} name="bruto" />
                <Area type="monotone" dataKey="liquido" stroke="#3b82f6" fill="url(#gL2)" strokeWidth={2} name="liquido" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* BU + Produtos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold text-white mb-4">Faturamento por BU</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={d.bus.filter(b => b.bruto > 0)} dataKey="bruto" nameKey="label"
                    cx="50%" cy="50%" outerRadius={80} label={({ label, percent }: any) =>
                      `${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {d.bus.filter(b => b.bruto > 0).map((b, i) => (
                      <Cell key={i} fill={BU_CORES[b.bu] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Bruto']} />
                  <Legend formatter={(v: string) => v} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold text-white mb-4">Top 8 Produtos por Faturamento</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={d.topProdutos.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: '#9ca3af', fontSize: 9 }} width={130}
                    tickFormatter={(v: string) => v.length > 22 ? v.substring(0, 22) + '…' : v} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(v: any) => [formatCurrency(v), 'Bruto']} />
                  <Bar dataKey="bruto" radius={[0, 4, 4, 0]}>
                    {d.topProdutos.slice(0, 8).map((p, i) => (
                      <Cell key={i} fill={BU_CORES[p.bu] ?? '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══ METAS & BUs ══════════════════════════════════════════════════════ */}
      {tab === 'Metas & BUs' && (
        <div className="space-y-6">
          {/* Metas mensais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { mes: 'Abril 2026', meta: 100000, cor: '#f59e0b', status: 'Em execução' },
              { mes: 'Maio 2026',  meta: 135000, cor: '#3b82f6', status: 'Em planejamento' },
              { mes: 'Junho 2026', meta: 175000, cor: '#8b5cf6', status: 'Em planejamento' },
            ].map(m => (
              <div key={m.mes} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">{m.mes}</div>
                <div className="text-2xl font-black mb-3" style={{ color: m.cor }}>{formatCurrency(m.meta)}</div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: m.mes === 'Abril 2026' ? `${pctMeta}%` : '0%', background: m.cor }} />
                </div>
                <div className="text-xs text-gray-500">{m.status}</div>
              </div>
            ))}
          </div>

          {/* Progresso por BU */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-semibold text-white mb-6">Progresso por BU — Meta Abril</h3>
            <div className="space-y-5">
              {[
                { bu: 'empresario', label: '🏢 Empresário',   meta: 55000,  cor: '#3b82f6' },
                { bu: 'nutricao',   label: '🥗 Nutrição',     meta: 20000,  cor: '#10b981' },
                { bu: 'mid',        label: '🧠 MID / MDV',    meta: 15000,  cor: '#8b5cf6' },
                { bu: 'gastro',     label: '🍽️ Gastronomia',  meta: 5000,   cor: '#f97316' },
                { bu: 'beleza',     label: '💅 Beleza',       meta: 3000,   cor: '#ec4899' },
                { bu: 'outros',     label: '🚀 Outros',       meta: 2000,   cor: '#f59e0b' },
              ].map(item => {
                const buData = d.bus.find(b => b.bu === item.bu)
                return (
                  <div key={item.bu}>
                    <Progress
                      label={item.label}
                      atual={buData?.bruto ?? 0}
                      meta={item.meta}
                      cor={item.cor}
                    />
                    {!buData && (
                      <div className="text-xs text-red-400 mt-1">⚠ Nenhuma venda no período — ativar tráfego urgente</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Simulador */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-semibold text-white mb-6">Simulador de ROI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                {[
                  { label: 'Budget Mensal', id: 'budget', min: 5000,  max: 50000, step: 1000, val: budget, set: setBudget, fmt: (v: number) => formatCurrency(v) },
                  { label: 'CPV Alvo (R$)', id: 'cpv',    min: 5,     max: 100,   step: 1,    val: cpv,    set: setCpv,    fmt: (v: number) => `R$ ${v}` },
                  { label: 'ARPU (R$)',     id: 'arpu',   min: 30,    max: 300,   step: 5,    val: arpu,   set: setArpu,   fmt: (v: number) => `R$ ${v}` },
                ].map(s => (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="text-white font-bold">{s.fmt(s.val)}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                      onChange={e => s.set(Number(e.target.value))}
                      className="w-full accent-blue-500" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 content-start">
                {[
                  { label: 'Vendas/mês',   value: simVendas.toLocaleString('pt-BR'), cor: 'text-white' },
                  { label: 'Faturamento',  value: formatCurrency(simFat),            cor: 'text-emerald-400' },
                  { label: 'ROI',          value: `${simROI.toFixed(1)}x`,           cor: simROI >= 4 ? 'text-emerald-400' : simROI >= 2.5 ? 'text-yellow-400' : 'text-red-400' },
                ].map(r => (
                  <div key={r.label} className="bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">{r.label}</div>
                    <div className={`text-xl font-black ${r.cor}`}>{r.value}</div>
                  </div>
                ))}
                <div className="col-span-3 bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Para atingir R$ 100k/mês</div>
                  <div className="text-lg font-bold text-blue-400">
                    {formatCurrency(Math.ceil(100000 / arpu) * cpv)} de budget
                    {' '}ou {Math.ceil(100000 / arpu)} vendas/mês
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
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'empresario', label: '🏢 Empresário' },
              { id: 'nutricao',   label: '🥗 Nutrição' },
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
                  <th className="text-right px-4 py-3">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {prodsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                      Nenhuma venda encontrada para esta BU no período
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
                    <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(p.bruto / p.vendas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ESTEIRAS ════════════════════════════════════════════════════════ */}
      {tab === 'Esteiras' && (
        <div className="space-y-4">
          {[
            {
              titulo: '🏢 Esteira Empresário', cor: '#3b82f6',
              status: 'ativo', statusLabel: '✓ Ativa — precisa de escala',
              passos: [
                { label: 'E-book R$27,90', sub: 'Front-end #1', cor: '#3b82f6' },
                { label: 'Pacote R$87,90', sub: 'Order Bump 84%', cor: '#10b981' },
                { label: 'R$247', sub: 'Empresário Lucrativo', cor: '#f59e0b' },
                { label: 'R$297-497', sub: 'Combo / LFE', cor: '#f59e0b' },
                { label: 'R$997-1997', sub: 'COLISEUM / Fin.Caos', cor: '#ec4899' },
              ],
              alerta: null,
            },
            {
              titulo: '🥗 Esteira Nutrição', cor: '#10b981',
              status: 'dormente', statusLabel: '🔴 INATIVA — 2º motor desligado',
              passos: [
                { label: '12 ebooks R$27,90', sub: 'Front-ends dormentes', cor: '#6b7280' },
                { label: 'Desinche R$47,90', sub: 'Order bump potencial', cor: '#6b7280' },
                { label: 'Barriga OFF R$147', sub: 'Curso principal', cor: '#6b7280' },
                { label: 'R$174-224/mês', sub: 'Recorrentes ignorados', cor: '#6b7280' },
              ],
              alerta: 'Ativar com tráfego urgente — potencial R$20k/mês',
            },
            {
              titulo: '🧠 Esteira MID / MDV', cor: '#8b5cf6',
              status: 'parcial', statusLabel: '⚠ Parcial — depende de lançamento',
              passos: [
                { label: 'Front-end R$27-47', sub: 'Ebooks e infoprodutos', cor: '#8b5cf6' },
                { label: 'EVENTO', sub: 'Lançamento online', cor: '#f59e0b' },
                { label: 'MID R$697', sub: 'Mentoria entrada ✓', cor: '#10b981' },
                { label: 'MID Pró R$2.997', sub: 'Mentoria premium ✓', cor: '#10b981' },
                { label: 'Imperium R$6.997', sub: 'Alto ticket', cor: '#ec4899' },
              ],
              alerta: 'Criar funil perpétuo para não depender de lançamentos',
            },
          ].map(e => (
            <div key={e.titulo} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-base">{e.titulo}</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  e.status === 'ativo' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  e.status === 'dormente' ? 'bg-red-950 text-red-400 border border-red-800' :
                  'bg-yellow-950 text-yellow-400 border border-yellow-800'
                }`}>{e.statusLabel}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {e.passos.map((p, i) => (
                  <>
                    <div key={i} className="rounded-lg px-3 py-2 text-center min-w-28"
                      style={{ background: `${p.cor}15`, border: `1px solid ${p.cor}40` }}>
                      <div className="text-sm font-bold" style={{ color: p.cor }}>{p.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.sub}</div>
                    </div>
                    {i < e.passos.length - 1 && <span className="text-gray-600 text-xl font-light">→</span>}
                  </>
                ))}
              </div>
              {e.alerta && (
                <div className="mt-4 p-3 rounded-lg text-xs bg-yellow-950 border border-yellow-800 text-yellow-300">
                  ⚡ {e.alerta}
                </div>
              )}
            </div>
          ))}
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
                  {['Visão Estratégica','Aprovações','Parcerias BU','Decisões Irreversíveis'].map(t => (
                    <span key={t} className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-950 text-yellow-400 border border-yellow-800">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Time */}
          {['Marketing', 'Produto', 'Inteligência', 'Tech'].map(dept => (
            <div key={dept} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{dept}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EQUIPE.filter(m => m.dept === dept).map(m => (
                  <div key={m.nome} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
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

          {/* BUs */}
          <div>
            <h3 className="font-bold text-white mb-4">Unidades de Negócio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                { bu: 'empresario', label: '🏢 Empresário',      nicho: 'Finanças, precificação, gestão',           parceria: '—',               status: 'Ativo',    cor: '#3b82f6' },
                { bu: 'nutricao',   label: '🥗 Saúde & Nutrição', nicho: 'Emagrecimento, saúde hormonal feminina',   parceria: 'Sócia nutricionista', status: 'Dormente', cor: '#10b981' },
                { bu: 'gastro',     label: '🍽️ Gastronomia',     nicho: 'Gestão de restaurantes e food service',    parceria: 'Sócio restaurateur', status: 'Parcial',  cor: '#f97316' },
                { bu: 'beleza',     label: '💅 Beleza',           nicho: 'Gestão de salão de beleza',                parceria: '—',               status: 'Dormente', cor: '#ec4899' },
                { bu: 'mid',        label: '🧠 MID / MDV',        nicho: 'Mentoria digital + Destrave sua vida',     parceria: '—',               status: 'Ativo',    cor: '#8b5cf6' },
                { bu: 'outros',     label: '🚀 Eventos Online',   nicho: 'Lançamentos que vendem as mentorias',      parceria: '—',               status: 'Sazonal',  cor: '#f59e0b' },
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
                    <div className="text-xs text-gray-400 mb-3">{b.nicho}</div>
                    {b.parceria !== '—' && (
                      <div className="text-xs text-blue-400 mb-2">🤝 {b.parceria}</div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-500">Faturamento 2026: </span>
                      <span className="font-semibold" style={{ color: b.cor }}>
                        {buData ? formatCurrency(buData.bruto) : 'R$ 0'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PLANO DE AÇÃO ════════════════════════════════════════════════════ */}
      {tab === 'Plano de Ação' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <KPI label="Total de Ações"     value="12"        sub="em 8 semanas" />
            <KPI label="Prazo"              value="8 semanas" sub="início imediato" />
            <KPI label="Meta Final"         value="R$ 175k"   sub="faturamento mensal" cor="#10b981" />
            <KPI label="BUs a Ativar"       value="4"         sub="Nutrição, Beleza, MID, Gastro" cor="#f59e0b" />
          </div>

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
                <span className="text-xs text-gray-500">{s.acoes.length} ações</span>
              </div>
              <div className="divide-y divide-gray-800">
                {s.acoes.map((a, ai) => (
                  <div key={ai} className="px-5 py-3">
                    <div className="text-sm text-white font-medium mb-1">{a.texto}</div>
                    <div className="flex gap-6 text-xs text-gray-500">
                      <span>👤 {a.resp}</span>
                      <span>🎯 {a.meta}</span>
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
