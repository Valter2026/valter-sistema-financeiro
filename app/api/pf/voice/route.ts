import { NextRequest, NextResponse } from 'next/server'

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
  vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,
  oitenta:80,noventa:90,
}
const HUNDREDS: Record<string, number> = {
  cem:100,cento:100,duzentos:200,duzentas:200,trezentos:300,trezentas:300,
  quatrocentos:400,quatrocentas:400,quinhentos:500,quinhentas:500,
  seiscentos:600,seiscentas:600,setecentos:700,setecentas:700,
  oitocentos:800,oitocentas:800,novecentos:900,novecentas:900,
}

function parsePtBRAmount(text: string): number {
  const t = text.toLowerCase()

  // 1. R$ 1.234,56 ou R$ 1234.56
  const reaisMatch = t.match(/r\$\s*([\d.,]+)/)
  if (reaisMatch) {
    const raw = reaisMatch[1].replace(/\./g, '').replace(',', '.')
    return parseFloat(raw) || 0
  }

  // 2. "1234,56 reais" ou "1234.56"
  const numCommaMatch = t.match(/([\d.]+,\d{1,2})\s*(?:reais?|conto)?/)
  if (numCommaMatch) {
    return parseFloat(numCommaMatch[1].replace('.','').replace(',','.')) || 0
  }

  // 3. Número puro antes de "reais/conto/mil"
  const pureNumMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:reais?|conto|k\b)?/)

  // 4. Construção por extenso: "dez mil", "duzentos e cinquenta", etc.
  let extensoVal = 0
  let found = false

  // Multipliers: mil, milhão
  const milMatch = t.match(/(\w+(?:\s+e\s+\w+)*)\s+mil(?:\s+e\s+([\w\s]+))?/)
  if (milMatch) {
    const before = parseWordNumber(milMatch[1])
    const after  = milMatch[2] ? parseWordNumber(milMatch[2]) : 0
    if (before > 0) { extensoVal = before * 1000 + after; found = true }
  }

  if (!found) {
    // Sem mil: "duzentos e cinquenta"
    const wordVal = parseWordNumber(t.replace(/reais?|conto|de|e/g, ' ').trim())
    if (wordVal > 0) { extensoVal = wordVal; found = true }
  }

  // 5. "Xk" = X * 1000
  const kMatch = t.match(/(\d+)\s*k\b/)
  if (kMatch) return parseInt(kMatch[1]) * 1000

  if (found && extensoVal > 0) return extensoVal
  if (pureNumMatch) return parseFloat(pureNumMatch[1]) || 0
  return 0
}

function parseWordNumber(text: string): number {
  const words = text.toLowerCase().trim().split(/\s+/)
  let total = 0
  let current = 0
  for (const w of words) {
    if (w === 'e') continue
    if (HUNDREDS[w] !== undefined) { current += HUNDREDS[w] }
    else if (TENS[w]  !== undefined) { current += TENS[w] }
    else if (TEENS[w] !== undefined) { current += TEENS[w] }
    else if (ONES[w]  !== undefined) { current += ONES[w] }
  }
  total += current
  return total
}

// ─── Mapa de categorias ──────────────────────────────────────────────────────
const CATEGORY_MAP: { name: string; keywords: RegExp }[] = [
  // Alimentação
  { name: 'Supermercado',     keywords: /mercado|supermercado|hortifrut|feira|atacad|compras de casa|compra de mercado/ },
  { name: 'Restaurante',      keywords: /restaurante|almo[çc]o|jantar|lanchonete|churrascar|rod[íi]zio|pizzaria|sushi|hamburguer|hamburgu/ },
  { name: 'Delivery',         keywords: /delivery|ifood|i-food|rappi|uber\s*eat|pedido.*comida|comida.*pedido/ },
  { name: 'Alimentação',      keywords: /padaria|lanche|café|cafe|sorvete|doceria|confeitaria|açougue|acougue|peixe|frango|carne/ },
  // Transporte
  { name: 'Combustível',      keywords: /gasolina|combust[íi]vel|etanol|[áa]lcool|posto|abastecer|abasteci/ },
  { name: 'Uber / Taxi',      keywords: /uber|taxi|t[áa]xi|99|cabify|corrida/ },
  { name: 'Ônibus / Metrô',   keywords: /[oô]nibus|metr[oô]|[bB]us|passagem|bilhete|vt|vale.*transporte/ },
  { name: 'Transporte',       keywords: /manutenção.*carro|mecânico|mecanico|funilaria|pneu|revisão.*carro|ipva|seguro.*carro/ },
  // Moradia
  { name: 'Aluguel',          keywords: /aluguel/ },
  { name: 'Condomínio',       keywords: /condom[íi]nio/ },
  { name: 'Energia Elétrica', keywords: /energia|luz|celpe|copel|cemig|coelba|eletric|conta.*luz|enel/ },
  { name: 'Água',             keywords: /[áa]gua|saneamento|sabesp|cedae|embasa/ },
  { name: 'Internet',         keywords: /internet|wifi|wi-fi|banda larga|fibra/ },
  { name: 'Moradia',          keywords: /telef[oô]n[eo]|celular|tim\b|claro\b|vivo\b|oi\b|gas\b|g[áa]s/ },
  // Saúde
  { name: 'Saúde',            keywords: /farm[áa]cia|rem[eé]dio|medic[ae]|m[eé]dic[ao]|dentist|hospital|cl[íi]nica|consulta|plano.*sa[úu]de|exame|laborat[oó]rio|academia|gym/ },
  // Educação
  { name: 'Educação',         keywords: /escola|faculdade|universidade|curso|livro|apostila|mensalidade.*escola|colegio|col[eé]gio/ },
  // Lazer
  { name: 'Lazer',            keywords: /netflix|spotify|amazon|prime|disney|hbo|youtube.*premium|streaming|cinema|teatro|show|festa|viagem|hotel|pousada|passeio/ },
  // Vestuário
  { name: 'Vestuário',        keywords: /roupa|calçado|cal[cç]ado|sapato|t[eê]nis|camisa|cal[cç]a|vestido|moda|loja.*roupa/ },
  // Cuidados Pessoais
  { name: 'Cuidados Pessoais',keywords: /sal[aã]o|barbearia|corte.*cabelo|manicure|pedicure|est[eé]tica|cosm[eé]tico|perfume|higiene/ },
  // Receitas
  { name: 'Salário',          keywords: /sal[áa]rio|pagamento.*sal[áa]rio|contracheque|holerite|pix.*sal[áa]rio/ },
  { name: 'Freelance',        keywords: /freelance|freela|projeto|presta[cç][aã]o.*servi[cç]o|honorar/ },
  { name: 'Investimentos',    keywords: /dividendo|rendimento|juros|aplica[cç][aã]o|resgate|investimento/ },
]

// ─── Detecta tipo de conta por voz ──────────────────────────────────────────
function detectAccountType(text: string): string | null {
  const t = text.toLowerCase()
  if (/cart[aã]o|cr[eé]dito|visa|master|elo|hipercard/.test(t)) return 'credit_card'
  if (/carteira|dinheiro|espécie|especie|caixa/.test(t))         return 'cash'
  if (/poupan[cç]a/.test(t))                                     return 'savings'
  if (/banco|conta|nubank|bradesco|ita[uú]|bb\b|caixa.*federal|santander|inter|c6|picpay|next/.test(t)) return 'checking'
  return null
}

// ─── Parser principal ────────────────────────────────────────────────────────
function parseVoiceInput(text: string) {
  const t = text.toLowerCase().trim()

  // 1. Tipo
  let type: 'expense' | 'income' = 'expense'
  if (/recebi|recebei|entrou|ganhei|sal[áa]rio|renda|rendimento|lucro/.test(t)) type = 'income'

  // 2. Valor
  const amount = parsePtBRAmount(t)

  // 3. Data
  const today = new Date()
  let date = today.toISOString().split('T')[0]
  if (/ontem/.test(t)) {
    const d = new Date(); d.setDate(d.getDate() - 1)
    date = d.toISOString().split('T')[0]
  } else if (/anteontem/.test(t)) {
    const d = new Date(); d.setDate(d.getDate() - 2)
    date = d.toISOString().split('T')[0]
  }

  // 4. Categoria
  let suggestedCategoryName = ''
  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.test(t)) { suggestedCategoryName = cat.name; break }
  }

  // 5. Tipo de conta
  const suggestedAccountType = detectAccountType(t)

  // 6. Descrição limpa
  let description = t
    .replace(/gastei|paguei|comprei|recebi|recebei|ganhei|fiz\s+um\s+pix|pix\s+de|pix\s+para/g, '')
    .replace(/r\$\s*[\d.,]+/g, '')
    .replace(/\b\d+[\d.,]*\s*(?:reais?|conto|mil|k)?\b/g, '')
    .replace(/\b(zero|um|uma|dois|duas|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|duzentas|trezentos|quinhentos|mil)\b/g, '')
    .replace(/\b(de|do|da|no|na|em|com|e|hoje|ontem|anteontem|esse|esse\s+mês)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!description || description.length < 2) {
    description = suggestedCategoryName || (type === 'income' ? 'Receita' : 'Gasto')
  }

  // Capitaliza primeira letra
  description = description.charAt(0).toUpperCase() + description.slice(1)

  return {
    type,
    amount,
    description,
    date,
    suggestedCategoryName,
    suggestedAccountType,
    original: text,
    confidence: amount > 0 ? 'high' : 'low',
  }
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  return NextResponse.json(parseVoiceInput(text))
}
