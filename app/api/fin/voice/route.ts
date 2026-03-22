import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── Parser de números em português ─────────────────────────────────────────
const ONES: Record<string, number> = {
  zero:0,um:1,uma:1,dois:2,duas:2,'três':3,tres:3,quatro:4,cinco:5,
  seis:6,sete:7,oito:8,nove:9,
}
const TEENS: Record<string, number> = {
  dez:10,onze:11,doze:12,treze:13,quatorze:14,catorze:14,quinze:15,
  dezesseis:16,dezasseis:16,dezessete:17,dezoito:18,dezenove:19,dezanove:19,
}
const TENS: Record<string, number> = {
  vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90,
}
const HUNDREDS: Record<string, number> = {
  cem:100,cento:100,duzentos:200,duzentas:200,trezentos:300,trezentas:300,
  quatrocentos:400,quatrocentas:400,quinhentos:500,quinhentas:500,
  seiscentos:600,seiscentas:600,setecentos:700,setecentas:700,
  oitocentos:800,oitocentas:800,novecentos:900,novecentas:900,
}

function parseWordNumber(text: string): number {
  const words = text.toLowerCase().trim().split(/\s+/)
  let total = 0
  for (const w of words) {
    if (w === 'e' || w === 'de') continue
    if (HUNDREDS[w] !== undefined) total += HUNDREDS[w]
    else if (TENS[w]  !== undefined) total += TENS[w]
    else if (TEENS[w] !== undefined) total += TEENS[w]
    else if (ONES[w]  !== undefined) total += ONES[w]
  }
  return total
}

function parsePtBRAmount(text: string): number {
  const t = text.toLowerCase()
  const reaisMatch = t.match(/r\$\s*([\d.]+(?:,\d{1,2})?)/)
  if (reaisMatch) return parseFloat(reaisMatch[1].replace(/\./g,'').replace(',','.')) || 0
  const commaMatch = t.match(/([\d.]+,\d{1,2})\s*(?:reais?|conto)?/)
  if (commaMatch) return parseFloat(commaMatch[1].replace(/\./g,'').replace(',','.')) || 0
  const kMatch = t.match(/(\d+)\s*k\b/)
  if (kMatch) return parseInt(kMatch[1]) * 1000
  const milMatch = t.match(/(.+?)\s+mil(?:\s+e\s+(.+?))?(?:\s+reais?|\s+conto|$)/)
  if (milMatch) {
    const before = parseWordNumber(milMatch[1])
    const after  = milMatch[2] ? parseWordNumber(milMatch[2]) : 0
    if (before > 0) return before * 1000 + after
  }
  const pureNumReais = t.match(/(\d+(?:\.\d+)?)\s*(?:reais?|conto)/)
  if (pureNumReais) return parseFloat(pureNumReais[1]) || 0
  const pureNum = t.match(/(\d+(?:\.\d+)?)/)
  if (pureNum) return parseFloat(pureNum[1]) || 0
  return parseWordNumber(t.replace(/reais?|conto|de|e/g,' '))
}

// ─── Categorias empresariais ─────────────────────────────────────────────────
const CATEGORY_RULES: { name: string; parent: string; type: 'expense'|'income'; keywords: RegExp }[] = [
  // Despesas operacionais
  { name:'Aluguel Comercial',     parent:'Custos Fixos',       type:'expense', keywords:/aluguel.*comercial|aluguel.*loja|aluguel.*escrit[oó]rio|ponto.*comercial/ },
  { name:'Energia Elétrica',      parent:'Custos Fixos',       type:'expense', keywords:/energia|luz\b|conta.*luz|eletric|enel|copel|cemig|celpe/ },
  { name:'Internet / Telefone',   parent:'Custos Fixos',       type:'expense', keywords:/internet|telefone|linha|plano.*empresa|wi-fi|banda larga|fibra/ },
  { name:'Água',                  parent:'Custos Fixos',       type:'expense', keywords:/[áa]gua|saneamento/ },
  { name:'Condomínio Comercial',  parent:'Custos Fixos',       type:'expense', keywords:/condom[íi]nio/ },
  // Pessoal
  { name:'Salário / Pró-Labore',  parent:'Pessoal',            type:'expense', keywords:/sal[áa]rio|pr[oó].*labore|prolabore|pagamento.*funcion|pagamento.*s[oó]cio/ },
  { name:'INSS / FGTS',           parent:'Pessoal',            type:'expense', keywords:/inss|fgts|encargo|previdência/ },
  { name:'Vale Transporte',       parent:'Pessoal',            type:'expense', keywords:/vale.*transporte|vt\b/ },
  { name:'Vale Refeição',         parent:'Pessoal',            type:'expense', keywords:/vale.*refei[cç][aã]o|vr\b|vale.*alimenta/ },
  { name:'13º / Férias',          parent:'Pessoal',            type:'expense', keywords:/13[oº°]|d[eé]cimo.*terceiro|f[eé]rias/ },
  // Fornecedores e estoque
  { name:'Matéria-Prima',         parent:'Compras',            type:'expense', keywords:/mat[eé]ria.*prima|insumo|material.*produ[cç]/ },
  { name:'Mercadoria / Estoque',  parent:'Compras',            type:'expense', keywords:/mercadoria|estoque|reposição|compra.*revend|produto.*revend/ },
  { name:'Fornecedor',            parent:'Compras',            type:'expense', keywords:/fornecedor|fatura.*fornecedor|nota.*fiscal.*compra/ },
  { name:'Embalagens',            parent:'Compras',            type:'expense', keywords:/embalagem|caixa.*produto|sacola|etiqueta/ },
  // Impostos
  { name:'DAS / Simples',         parent:'Impostos',           type:'expense', keywords:/das\b|simples.*nacional|simples\b|guia.*imposto/ },
  { name:'ICMS',                  parent:'Impostos',           type:'expense', keywords:/icms/ },
  { name:'ISS',                   parent:'Impostos',           type:'expense', keywords:/iss\b/ },
  { name:'PIS / COFINS',          parent:'Impostos',           type:'expense', keywords:/pis\b|cofins/ },
  { name:'IRPJ / CSLL',           parent:'Impostos',           type:'expense', keywords:/irpj|csll|imposto.*renda.*empresa/ },
  // Marketing e vendas
  { name:'Marketing / Publicidade',parent:'Marketing',         type:'expense', keywords:/marketing|publicidade|propaganda|m[íi]dia|instagram.*impulsionar|facebook.*ads|google.*ads|anúncio/ },
  { name:'Site / Sistema',        parent:'Marketing',          type:'expense', keywords:/site\b|sistema|software|plataforma|assinatura.*sistema|erp|crm\b/ },
  // Transporte e logística
  { name:'Frete / Entrega',       parent:'Logística',          type:'expense', keywords:/frete|entrega|motoboy|logística|transpor/ },
  { name:'Combustível',           parent:'Logística',          type:'expense', keywords:/gasolina|combust[íi]vel|etanol|posto|abastecer/ },
  { name:'Manutenção Veículo',    parent:'Logística',          type:'expense', keywords:/mec[âa]nico|pneu|revis[aã]o.*carro|borracharia|troca.*[oó]leo/ },
  // Serviços profissionais
  { name:'Contador / Escritório', parent:'Serviços',           type:'expense', keywords:/contador|contabilidade|escrit[oó]rio.*contabil/ },
  { name:'Advogado / Jurídico',   parent:'Serviços',           type:'expense', keywords:/advogado|jur[íi]dico|advocacia/ },
  { name:'Consultoria',           parent:'Serviços',           type:'expense', keywords:/consultoria|consultor/ },
  // Manutenção
  { name:'Manutenção / Reforma',  parent:'Manutenção',         type:'expense', keywords:/manuten[cç][aã]o|reforma|conserto|reparo|t[eé]cnico/ },
  { name:'Equipamentos',          parent:'Manutenção',         type:'expense', keywords:/equipamento|m[áa]quina|computador|impressora|notebook/ },
  // Financeiro
  { name:'Juros / Tarifas Banco', parent:'Financeiro',         type:'expense', keywords:/juros|tarifa.*banco|taxa.*banco|anuidade|iof/ },
  { name:'Empréstimo / Financ.',  parent:'Financeiro',         type:'expense', keywords:/empr[eé]stimo|financiamento|parcela.*banco/ },
  // Receitas
  { name:'Venda de Produtos',     parent:'Vendas',             type:'income',  keywords:/venda|vendeu|vendemos|receita.*venda|produto.*vend/ },
  { name:'Prestação de Serviços', parent:'Receitas',           type:'income',  keywords:/servi[cç]o|presta[cç][aã]o|cobran[cç]a.*servi[cç]o|nota.*servi[cç]o/ },
  { name:'Mensalidade / Assin.',  parent:'Receitas',           type:'income',  keywords:/mensalidade|assinatura.*receb|recorrente/ },
  { name:'Comissão Recebida',     parent:'Receitas',           type:'income',  keywords:/comiss[aã]o.*receb|recebi.*comiss[aã]o/ },
  { name:'Antecipação / Aporte',  parent:'Receitas',           type:'income',  keywords:/aporte|antecipa[cç][aã]o|capital|investimento.*empresa/ },
]

function detectAccountType(text: string): string | null {
  const t = text.toLowerCase()
  if (/cart[aã]o|cr[eé]dito|visa|master|elo/.test(t))     return 'credit_card'
  if (/carteira|dinheiro|esp[eé]cie|caixa/.test(t))        return 'cash'
  if (/poupan[cç]a/.test(t))                               return 'savings'
  if (/nubank|bradesco|ita[uú]|bb\b|caixa.*federal|santander|inter\b|c6|banco/.test(t)) return 'checking'
  return null
}

function parseVoiceInput(text: string) {
  const t = text.toLowerCase().trim()

  let type: 'expense' | 'income' = 'expense'
  if (/recebi|recebeu|recebemos|entrou|venda.*confirm|faturou|faturamos|pagamento.*cliente|cliente.*pagou/.test(t)) type = 'income'

  const amount = parsePtBRAmount(t)

  const today = new Date()
  let date = today.toISOString().split('T')[0]
  if (/ontem/.test(t))     { const d = new Date(); d.setDate(d.getDate()-1); date = d.toISOString().split('T')[0] }
  if (/anteontem/.test(t)) { const d = new Date(); d.setDate(d.getDate()-2); date = d.toISOString().split('T')[0] }

  const rule = CATEGORY_RULES.find(r => r.type === type && r.keywords.test(t))
  const suggestedCategoryName = rule?.name ?? ''
  const suggestedParentName   = rule?.parent ?? ''
  const suggestedAccountType  = detectAccountType(t)

  let description = t
    .replace(/paguei|pagamos|gastei|gastamos|comprei|compramos|recebi|recebemos|recebeu|lancei|lan[cç]amos|efetuei|efetuamos/g, '')
    .replace(/r\$\s*[\d.,]+/g, '')
    .replace(/\b\d+[\d.,]*\s*(?:reais?|conto|mil|k)?\b/g, '')
    .replace(/\b(zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos?|trezentos?|quinhentos?|mil)\b/g, '')
    .replace(/\b(de|do|da|no|na|em|com|e|hoje|ontem|anteontem|para|pelo|pela)\b/g, ' ')
    .replace(/\s+/g, ' ').trim()

  if (!description || description.length < 2)
    description = suggestedCategoryName || (type === 'income' ? 'Receita' : 'Despesa')

  description = description.charAt(0).toUpperCase() + description.slice(1)

  return {
    type, amount, description, date,
    suggestedCategoryName, suggestedParentName,
    suggestedAccountType,
    original: text,
    confidence: amount > 0 ? 'high' : 'low',
  }
}

// POST — interpreta texto
export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  return NextResponse.json(parseVoiceInput(text))
}

// PUT — salva lançamento por voz (auto-confirm)
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { text, account_id } = body
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })

  const parsed = parseVoiceInput(text)
  if (parsed.amount === 0) return NextResponse.json({ error: 'Valor não detectado', parsed }, { status: 422 })

  // Resolve categoria
  let categoryId: string | null = null
  if (parsed.suggestedCategoryName) {
    const { data: existing } = await supabaseAdmin
      .from('fin_categories').select('id').ilike('name', parsed.suggestedCategoryName).single()
    if (existing) {
      categoryId = existing.id
    } else {
      let parentId: string | null = null
      if (parsed.suggestedParentName) {
        const { data: parent } = await supabaseAdmin
          .from('fin_categories').select('id').ilike('name', parsed.suggestedParentName).single()
        parentId = parent?.id ?? null
      }
      const { data: newCat } = await supabaseAdmin
        .from('fin_categories')
        .insert([{ name: parsed.suggestedCategoryName, type: parsed.type, color: '#6b7280', parent_id: parentId }])
        .select().single()
      categoryId = newCat?.id ?? null
    }
  }

  // Resolve conta
  let resolvedAccountId = account_id || null
  if (!resolvedAccountId && parsed.suggestedAccountType) {
    const { data: acc } = await supabaseAdmin
      .from('fin_accounts').select('id').eq('type', parsed.suggestedAccountType).eq('active', true).limit(1).single()
    resolvedAccountId = acc?.id ?? null
  }
  if (!resolvedAccountId) {
    const { data: firstAcc } = await supabaseAdmin
      .from('fin_accounts').select('id').eq('active', true).limit(1).single()
    resolvedAccountId = firstAcc?.id ?? null
  }

  const { data, error } = await supabaseAdmin
    .from('fin_transactions')
    .insert([{
      type:        parsed.type,
      description: parsed.description,
      amount:      parsed.amount,
      date:        parsed.date,
      account_id:  resolvedAccountId,
      category_id: categoryId,
      status:      'confirmed',
    }])
    .select('*, account:fin_accounts(name), category:fin_categories(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, transaction: data, parsed })
}
