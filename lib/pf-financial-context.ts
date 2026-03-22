import { supabaseAdmin } from '@/lib/supabase'

export const ADVISOR_SYSTEM_PROMPT = `Você é um consultor financeiro pessoal de elite, especialista em finanças pessoais brasileiras.
Você combina a energia, didática e empoderamento da Nathalia Arcuri com a estratégia de patrimônio e investimentos do Gustavo Cerbasi.

Seu estilo:
- Direto, prático, motivador — sem enrolação
- Usa dados reais do usuário para personalizar cada orientação
- Fala em português do Brasil, de forma acessível mas profissional
- Celebra conquistas e é honesto sobre problemas financeiros
- Sempre termina com uma ação concreta e específica

Regras:
- Retorne APENAS um JSON válido, sem markdown, sem explicações fora do JSON
- O JSON é um array de objetos de orientação
- Cada orientação tem: type, title, message, action, priority
- type: "alert" (urgente/vermelho) | "warning" (atenção/amarelo) | "tip" (dica/verde) | "goal" (meta/azul) | "success" (parabéns/esmeralda)
- priority: "high" | "medium" | "low"
- message: 2-3 frases impactantes, personalizadas com os dados reais
- action: 1 ação específica e executável que o usuário pode fazer hoje ou esta semana
- Gere entre 4 e 7 orientações, priorizando as mais urgentes primeiro
- Se houver pergunta do usuário, responda como primeira orientação do tipo "tip" com priority "high"`

export async function getFinancialContext() {
  const now   = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
  const end   = now.toISOString().split('T')[0]

  const [txRes, accRes, goalRes, budgetRes, billsRes] = await Promise.all([
    supabaseAdmin.from('pf_transactions').select('type,amount,status,date,description').eq('status','confirmed').gte('date', start).lte('date', end),
    supabaseAdmin.from('pf_accounts').select('*'),
    supabaseAdmin.from('pf_goals').select('*').eq('status','active'),
    supabaseAdmin.from('pf_budgets').select('*, category:pf_categories(name)').eq('month', now.getMonth()+1).eq('year', now.getFullYear()),
    supabaseAdmin.from('pf_transactions').select('id,amount,date,description,category:pf_categories(name)').in('status',['pending','scheduled']).eq('type','expense'),
  ])

  const txs   = txRes.data   ?? []
  const accs  = accRes.data  ?? []
  const goals = goalRes.data ?? []
  const bills = billsRes.data ?? []

  const receitas = txs.filter(t => t.type==='income').reduce((a,t) => a+Number(t.amount), 0)
  const despesas = txs.filter(t => t.type==='expense').reduce((a,t) => a+Number(t.amount), 0)

  const { data: allTx } = await supabaseAdmin.from('pf_transactions').select('account_id,type,amount').eq('status','confirmed')
  const accountsWithBalance = accs.map(acc => {
    const mov    = (allTx??[]).filter(t => t.account_id === acc.id)
    const inflow = mov.filter(t => t.type==='income').reduce((a,t) => a+Number(t.amount), 0)
    const out    = mov.filter(t => t.type==='expense').reduce((a,t) => a+Number(t.amount), 0)
    return { name: acc.name, type: acc.type, balance: Number(acc.opening_balance??0)+inflow-out }
  })
  const patrimonio = accountsWithBalance.reduce((a,acc) => a+acc.balance, 0)

  const budgets = budgetRes.data ?? []
  const lastDay   = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
  const diasRest  = lastDay - now.getDate()
  const today     = end
  const vencendo3 = bills.filter(b => {
    const diff = Math.ceil((new Date(b.date+'T12:00:00').getTime() - new Date().getTime()) / 86400000)
    return diff >= 0 && diff <= 3
  })
  const vencidas  = bills.filter(b => b.date < today)

  const goalsInfo = goals.map(g => ({
    name:    g.name,
    target:  g.target_amount,
    current: g.current_amount,
    pct:     Math.round((g.current_amount/g.target_amount)*100),
  }))

  const history = await Promise.all([1,2,3].map(async offset => {
    const d  = new Date(now.getFullYear(), now.getMonth()-offset, 1)
    const m  = String(d.getMonth()+1).padStart(2,'0')
    const y  = d.getFullYear()
    const { data: ht } = await supabaseAdmin.from('pf_transactions')
      .select('type,amount').eq('status','confirmed').gte('date',`${y}-${m}-01`).lte('date',`${y}-${m}-31`)
    const r = (ht??[]).filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount),0)
    const e = (ht??[]).filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0)
    return { mes: d.toLocaleString('pt-BR',{month:'long'}), receitas:r, despesas:e, resultado:r-e }
  }))

  return {
    mesAtual: now.toLocaleString('pt-BR',{month:'long',year:'numeric'}),
    receitas, despesas, resultado: receitas-despesas,
    patrimonio, diasRestantesMes: diasRest,
    contas: accountsWithBalance,
    metas: goalsInfo,
    contasVencendo3dias: vencendo3.map(b => ({ desc: b.description, valor: b.amount, data: b.date })),
    contasVencidas: vencidas.map(b => ({ desc: b.description, valor: b.amount, data: b.date })),
    orcamentos: budgets.map((b:any) => ({ categoria: b.category?.name, limite: b.amount, gasto: b.spent, pct: b.percent })),
    historico3meses: history,
  }
}

export function buildUserMessage(ctx: Awaited<ReturnType<typeof getFinancialContext>>, question = '') {
  return `
Dados financeiros do usuário — ${ctx.mesAtual}:

RESUMO DO MÊS:
- Receitas confirmadas: R$ ${ctx.receitas.toFixed(2)}
- Despesas confirmadas: R$ ${ctx.despesas.toFixed(2)}
- Resultado: R$ ${ctx.resultado.toFixed(2)} (${ctx.resultado >= 0 ? 'POSITIVO ✓' : 'NEGATIVO ✗'})
- Dias restantes no mês: ${ctx.diasRestantesMes}
- Patrimônio total: R$ ${ctx.patrimonio.toFixed(2)}

CONTAS:
${ctx.contas.map(a => `- ${a.name} (${a.type}): R$ ${a.balance.toFixed(2)}`).join('\n')}

CONTAS A PAGAR — VENCENDO EM ATÉ 3 DIAS:
${ctx.contasVencendo3dias.length === 0 ? '- Nenhuma' : ctx.contasVencendo3dias.map(b => `- ${b.desc}: R$ ${Number(b.valor).toFixed(2)} (vence ${b.data})`).join('\n')}

CONTAS VENCIDAS:
${ctx.contasVencidas.length === 0 ? '- Nenhuma' : ctx.contasVencidas.map(b => `- ${b.desc}: R$ ${Number(b.valor).toFixed(2)} (venceu ${b.data})`).join('\n')}

ORÇAMENTOS:
${ctx.orcamentos.length === 0 ? '- Sem orçamentos definidos' : ctx.orcamentos.map((o:any) => `- ${o.categoria}: ${o.pct}% usado (R$ ${Number(o.gasto).toFixed(2)} de R$ ${Number(o.limite).toFixed(2)})`).join('\n')}

METAS:
${ctx.metas.length === 0 ? '- Sem metas cadastradas' : ctx.metas.map(m => `- ${m.name}: ${m.pct}% (R$ ${Number(m.current).toFixed(2)} de R$ ${Number(m.target).toFixed(2)})`).join('\n')}

HISTÓRICO 3 MESES:
${ctx.historico3meses.map(h => `- ${h.mes}: receitas R$ ${h.receitas.toFixed(2)}, despesas R$ ${h.despesas.toFixed(2)}, resultado R$ ${h.resultado.toFixed(2)}`).join('\n')}

${question ? `PERGUNTA DO USUÁRIO: "${question}"` : ''}

Gere as orientações financeiras personalizadas em JSON.`
}

const WEEKLY_PROMPT = `Você é um consultor financeiro pessoal que fala como Nathalia Arcuri: direto, motivador, empoderador.
Crie um script de áudio para a orientação financeira SEMANAL do usuário.

Regras:
- MÁXIMO 650 palavras (≈ 5 minutos de fala em ritmo normal)
- Tom conversacional, como se estivesse falando ao ouvido do usuário
- Sem títulos, sem markdown, sem bullet points — é para ser lido em voz alta
- Comece com uma saudação curta e o período (ex: "Olá! Aqui está sua orientação financeira da semana...")
- Apresente os números de forma natural (não liste, conte uma história)
- Destaque 2 ou 3 prioridades claras para a semana
- Termine com 1 frase motivacional curta e 3 ações específicas numeradas
- Retorne APENAS o texto do script, sem explicações adicionais`

const MONTHLY_PROMPT = `Você é um consultor financeiro pessoal que fala como Gustavo Cerbasi: estratégico, claro, focado em patrimônio.
Crie um script de áudio para a orientação financeira MENSAL do usuário.

Regras:
- MÁXIMO 650 palavras (≈ 5 minutos de fala em ritmo normal)
- Tom consultivo e estratégico, como uma sessão de coaching financeiro
- Sem títulos, sem markdown, sem bullet points — é para ser lido em voz alta
- Comece com "Sua orientação financeira do mês de [mês]..."
- Resuma o desempenho do mês com os números reais
- Analise o progresso das metas
- Diga exatamente o que precisa acontecer no restante do mês para os objetivos serem alcançados
- Termine com 3 decisões financeiras prioritárias para o mês
- Retorne APENAS o texto do script, sem explicações adicionais`

export async function runWeeklyScript(): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY não configurada')
  const ctx = await getFinancialContext()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 1500,
      system:     WEEKLY_PROMPT,
      messages:   [{ role: 'user', content: buildUserMessage(ctx) }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API: ${await res.text()}`)
  const aiRes = await res.json()
  return aiRes.content?.[0]?.text?.trim() ?? ''
}

export async function runMonthlyScript(): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY não configurada')
  const ctx = await getFinancialContext()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 1500,
      system:     MONTHLY_PROMPT,
      messages:   [{ role: 'user', content: buildUserMessage(ctx) }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API: ${await res.text()}`)
  const aiRes = await res.json()
  return aiRes.content?.[0]?.text?.trim() ?? ''
}

export async function runAdvisor(question = ''): Promise<any[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY não configurada')
  const ctx = await getFinancialContext()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      system:     ADVISOR_SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: buildUserMessage(ctx, question) }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API: ${await res.text()}`)
  const aiRes   = await res.json()
  const content = aiRes.content?.[0]?.text ?? '[]'
  try {
    const match = content.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : []
  } catch { return [] }
}
