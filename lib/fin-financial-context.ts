import { supabaseAdmin } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export const FIN_ADVISOR_SYSTEM_PROMPT = `Você é um Consultor Financeiro Empresarial de elite, especialista em gestão financeira de pequenas e médias empresas brasileiras.
Apresente-se sempre como "seu Consultor Financeiro Empresarial" — nunca use nomes de pessoas reais.

Suas estratégias e metodologias (use-as, sem citar seus criadores):
- Gestão de fluxo de caixa: ciclo financeiro, capital de giro, projeção de caixa
- Análise de rentabilidade: DRE gerencial, margem de contribuição, ponto de equilíbrio
- Controle de inadimplência: prazo médio de recebimento, gestão de contas a receber
- Redução de custos: análise de despesas por categoria, eficiência operacional
- Crescimento sustentável: reinvestimento, reserva empresarial, expansão planejada
- Indicadores financeiros: EBITDA simplificado, liquidez, endividamento

Seu estilo:
- Direto, estratégico e focado em resultado — sem enrolação
- Usa dados reais da empresa para personalizar cada orientação
- Fala em português do Brasil, de forma profissional mas acessível
- É honesto sobre problemas financeiros da empresa
- Sempre termina com uma ação concreta e específica para o gestor

Regras:
- Retorne APENAS um JSON válido, sem markdown, sem explicações fora do JSON
- O JSON é um array de objetos de orientação
- Cada orientação tem: type, title, message, action, priority
- type: "alert" (urgente/vermelho) | "warning" (atenção/amarelo) | "tip" (dica/verde) | "goal" (meta/azul) | "success" (parabéns/esmeralda)
- priority: "high" | "medium" | "low"
- message: 2-3 frases impactantes, personalizadas com os dados reais da empresa
- action: 1 ação específica e executável que o gestor pode fazer hoje ou esta semana
- Gere entre 4 e 7 orientações, priorizando as mais urgentes primeiro
- Se houver pergunta do gestor, responda como primeira orientação do tipo "tip" com priority "high"`

const FIN_WEEKLY_PROMPT = `Você é um Consultor Financeiro Empresarial de elite. Apresente-se como "seu Consultor Financeiro Empresarial".
Crie um script de áudio para a orientação financeira SEMANAL do gestor.
Use metodologias de gestão financeira empresarial: fluxo de caixa, inadimplência, capital de giro, controle de custos.

Regras:
- MÁXIMO 650 palavras (≈ 5 minutos de fala em ritmo normal)
- Tom estratégico e direto, como um briefing executivo semanal
- Sem títulos, sem markdown, sem bullet points — é para ser lido em voz alta
- Comece com: "Olá! Aqui está seu briefing financeiro empresarial da semana."
- Apresente os números da empresa de forma fluida e estratégica
- Destaque 2 ou 3 prioridades financeiras claras para a semana
- Termine com 3 ações executivas numeradas e específicas para a semana
- Retorne APENAS o texto do script, sem explicações adicionais`

const FIN_MONTHLY_PROMPT = `Você é um Consultor Financeiro Empresarial de elite. Apresente-se como "seu Consultor Financeiro Empresarial".
Crie um script de áudio para a orientação financeira MENSAL do gestor.
Use metodologias de análise empresarial: DRE, margem, ponto de equilíbrio, ciclo financeiro.

Regras:
- MÁXIMO 650 palavras (≈ 5 minutos de fala em ritmo normal)
- Tom analítico e estratégico, como uma reunião de fechamento mensal
- Sem títulos, sem markdown, sem bullet points — é para ser lido em voz alta
- Comece com: "Aqui está sua análise financeira empresarial do mês de [mês]."
- Analise o DRE: receitas, despesas, resultado e margem
- Avalie inadimplência, capital de giro e fluxo de caixa
- Projete o que precisa acontecer para atingir os objetivos
- Termine com 3 decisões financeiras prioritárias para o mês
- Retorne APENAS o texto do script, sem explicações adicionais`

export async function getFinancialContext(db?: SupabaseClient) {
  const sb = db ?? supabaseAdmin
  const now   = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
  const end   = now.toISOString().split('T')[0]

  const [txRes, accRes, catRes] = await Promise.all([
    sb.from('fin_transactions').select('type,amount,status,date,description,category_id').eq('status','confirmed').gte('date',start).lte('date',end),
    sb.from('fin_accounts').select('*').eq('active',true),
    sb.from('fin_categories').select('id,name,type'),
  ])

  const txs  = txRes.data  ?? []
  const accs = accRes.data ?? []
  const cats = catRes.data ?? []

  const receitas = txs.filter(t => t.type==='income').reduce((a,t) => a+Number(t.amount), 0)
  const despesas = txs.filter(t => t.type==='expense').reduce((a,t) => a+Number(t.amount), 0)

  // Saldo por conta
  const { data: allTx } = await sb.from('fin_transactions').select('account_id,to_account_id,type,amount').eq('status','confirmed')
  const accountsWithBalance = accs.map(acc => {
    const mov    = (allTx??[]).filter(t => t.account_id === acc.id)
    const transIn  = (allTx??[]).filter(t => t.to_account_id === acc.id && t.type === 'transfer')
    const inflow = mov.filter(t => t.type==='income').reduce((a,t) => a+Number(t.amount), 0)
    const out    = mov.filter(t => t.type==='expense').reduce((a,t) => a+Number(t.amount), 0)
    const transOut = mov.filter(t => t.type==='transfer').reduce((a,t) => a+Number(t.amount), 0)
    const transInVal = transIn.reduce((a,t) => a+Number(t.amount), 0)
    return { name: acc.name, type: acc.type, balance: Number(acc.opening_balance??0)+inflow-out-transOut+transInVal }
  })
  const caixaTotal = accountsWithBalance.reduce((a,acc) => a+acc.balance, 0)

  // Contas a pagar (pending/scheduled expenses)
  const { data: aPagar } = await sb.from('fin_transactions')
    .select('id,amount,date,due_date,description,category_id').in('status',['pending','scheduled']).eq('type','expense')

  // Contas a receber (pending/scheduled income)
  const { data: aReceber } = await sb.from('fin_transactions')
    .select('id,amount,date,due_date,description,category_id').in('status',['pending','scheduled']).eq('type','income')

  const today = end
  const vencidasPagar   = (aPagar??[]).filter(t => (t.due_date||t.date) < today)
  const vencidasReceber = (aReceber??[]).filter(t => (t.due_date||t.date) < today)
  const vencendo3       = (aPagar??[]).filter(t => {
    const d = t.due_date || t.date
    const diff = Math.ceil((new Date(d+'T12:00:00').getTime()-new Date().getTime())/86400000)
    return diff >= 0 && diff <= 3
  })

  const totalAPagar   = (aPagar??[]).reduce((a,t) => a+Number(t.amount), 0)
  const totalAReceber = (aReceber??[]).reduce((a,t) => a+Number(t.amount), 0)

  // Despesas por categoria (top 5)
  const catMap: Record<string, { name: string; total: number }> = {}
  txs.filter(t => t.type==='expense' && t.category_id).forEach(t => {
    const cat = cats.find(c => c.id === t.category_id)
    if (!cat) return
    if (!catMap[cat.id]) catMap[cat.id] = { name: cat.name, total: 0 }
    catMap[cat.id].total += Number(t.amount)
  })
  const topDespesas = Object.values(catMap).sort((a,b) => b.total-a.total).slice(0,5)

  // Histórico 3 meses
  const history = await Promise.all([1,2,3].map(async offset => {
    const d = new Date(now.getFullYear(), now.getMonth()-offset, 1)
    const m = String(d.getMonth()+1).padStart(2,'0')
    const y = d.getFullYear()
    const { data: ht } = await sb.from('fin_transactions')
      .select('type,amount').eq('status','confirmed').gte('date',`${y}-${m}-01`).lte('date',`${y}-${m}-31`)
    const r = (ht??[]).filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount),0)
    const e = (ht??[]).filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0)
    return { mes: d.toLocaleString('pt-BR',{month:'long'}), receitas:r, despesas:e, resultado:r-e, margem: r>0?Math.round(((r-e)/r)*100):0 }
  }))

  const lastDay  = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
  const diasRest = lastDay - now.getDate()

  return {
    mesAtual: now.toLocaleString('pt-BR',{month:'long',year:'numeric'}),
    receitas, despesas, resultado: receitas-despesas,
    margem: receitas>0 ? Math.round(((receitas-despesas)/receitas)*100) : 0,
    caixaTotal, diasRestantesMes: diasRest,
    contas: accountsWithBalance,
    totalAPagar, totalAReceber,
    inadimplencia: vencidasReceber.reduce((a,t) => a+Number(t.amount), 0),
    contasVencendo3dias: vencendo3.map(t => ({ desc: t.description, valor: t.amount, data: t.due_date||t.date })),
    contasVencidasPagar:   vencidasPagar.map(t => ({ desc: t.description, valor: t.amount, data: t.due_date||t.date })),
    contasVencidasReceber: vencidasReceber.map(t => ({ desc: t.description, valor: t.amount, data: t.due_date||t.date })),
    topDespesas,
    historico3meses: history,
  }
}

export function buildFinUserMessage(ctx: Awaited<ReturnType<typeof getFinancialContext>>, question = '') {
  return `
Dados financeiros da empresa — ${ctx.mesAtual}:

RESULTADO DO MÊS:
- Receitas confirmadas: R$ ${ctx.receitas.toFixed(2)}
- Despesas confirmadas: R$ ${ctx.despesas.toFixed(2)}
- Resultado: R$ ${ctx.resultado.toFixed(2)} (${ctx.resultado >= 0 ? 'LUCRO ✓' : 'PREJUÍZO ✗'})
- Margem: ${ctx.margem}%
- Dias restantes no mês: ${ctx.diasRestantesMes}

CAIXA:
- Total disponível: R$ ${ctx.caixaTotal.toFixed(2)}
${ctx.contas.map(a => `- ${a.name} (${a.type}): R$ ${a.balance.toFixed(2)}`).join('\n')}

CONTAS A PAGAR:
- Total pendente: R$ ${ctx.totalAPagar.toFixed(2)}
- Vencidas: ${ctx.contasVencidasPagar.length === 0 ? 'Nenhuma' : ctx.contasVencidasPagar.map(t => `${t.desc}: R$ ${Number(t.valor).toFixed(2)} (${t.data})`).join(', ')}
- Vencendo em 3 dias: ${ctx.contasVencendo3dias.length === 0 ? 'Nenhuma' : ctx.contasVencendo3dias.map(t => `${t.desc}: R$ ${Number(t.valor).toFixed(2)} (${t.data})`).join(', ')}

CONTAS A RECEBER:
- Total a receber: R$ ${ctx.totalAReceber.toFixed(2)}
- Inadimplência (vencidas): R$ ${ctx.inadimplencia.toFixed(2)}
${ctx.contasVencidasReceber.length > 0 ? '- Recebíveis vencidos: ' + ctx.contasVencidasReceber.map(t => `${t.desc}: R$ ${Number(t.valor).toFixed(2)}`).join(', ') : ''}

TOP 5 DESPESAS POR CATEGORIA:
${ctx.topDespesas.length === 0 ? '- Sem despesas categorizadas' : ctx.topDespesas.map(d => `- ${d.name}: R$ ${d.total.toFixed(2)}`).join('\n')}

HISTÓRICO 3 MESES:
${ctx.historico3meses.map(h => `- ${h.mes}: receitas R$ ${h.receitas.toFixed(2)}, despesas R$ ${h.despesas.toFixed(2)}, resultado R$ ${h.resultado.toFixed(2)}, margem ${h.margem}%`).join('\n')}

${question ? `PERGUNTA DO GESTOR: "${question}"` : ''}

Gere as orientações financeiras empresariais personalizadas em JSON.`
}

async function callAnthropic(system: string, userMsg: string, maxTokens = 2048) {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurada')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system, messages: [{ role: 'user', content: userMsg }] }),
  })
  if (!res.ok) throw new Error(`Anthropic API: ${await res.text()}`)
  return await res.json()
}

export async function runFinAdvisor(question = '', db?: SupabaseClient): Promise<any[]> {
  const ctx   = await getFinancialContext(db)
  const aiRes = await callAnthropic(FIN_ADVISOR_SYSTEM_PROMPT, buildFinUserMessage(ctx, question))
  const text  = aiRes.content?.[0]?.text ?? '[]'
  try { const m = text.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : [] } catch { return [] }
}

export async function runFinWeeklyScript(db?: SupabaseClient): Promise<string> {
  const ctx   = await getFinancialContext(db)
  const aiRes = await callAnthropic(FIN_WEEKLY_PROMPT, buildFinUserMessage(ctx), 1500)
  return aiRes.content?.[0]?.text?.trim() ?? ''
}

export async function runFinMonthlyScript(db?: SupabaseClient): Promise<string> {
  const ctx   = await getFinancialContext(db)
  const aiRes = await callAnthropic(FIN_MONTHLY_PROMPT, buildFinUserMessage(ctx), 1500)
  return aiRes.content?.[0]?.text?.trim() ?? ''
}
