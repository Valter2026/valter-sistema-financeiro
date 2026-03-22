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

  // R$ 1.234,56
  const reaisMatch = t.match(/r\$\s*([\d.]+(?:,\d{1,2})?)/)
  if (reaisMatch) return parseFloat(reaisMatch[1].replace(/\./g,'').replace(',','.')) || 0

  // 1234,56 reais
  const commaMatch = t.match(/([\d.]+,\d{1,2})\s*(?:reais?|conto)?/)
  if (commaMatch) return parseFloat(commaMatch[1].replace(/\./g,'').replace(',','.')) || 0

  // Xk = X * 1000
  const kMatch = t.match(/(\d+)\s*k\b/)
  if (kMatch) return parseInt(kMatch[1]) * 1000

  // "dez mil e quinhentos" ou "cinco mil"
  const milMatch = t.match(/(.+?)\s+mil(?:\s+e\s+(.+?))?(?:\s+reais?|\s+conto|$)/)
  if (milMatch) {
    const before = parseWordNumber(milMatch[1])
    const after  = milMatch[2] ? parseWordNumber(milMatch[2]) : 0
    if (before > 0) return before * 1000 + after
  }

  // Número puro seguido de reais/conto
  const pureNumReais = t.match(/(\d+(?:\.\d+)?)\s*(?:reais?|conto)/)
  if (pureNumReais) return parseFloat(pureNumReais[1]) || 0

  // Número puro
  const pureNum = t.match(/(\d+(?:\.\d+)?)/)
  if (pureNum) return parseFloat(pureNum[1]) || 0

  // Extenso puro: "duzentos e cinquenta"
  const wordVal = parseWordNumber(t.replace(/reais?|conto|de|e/g,' '))
  return wordVal
}

// ─── Mapa de categorias com parent ──────────────────────────────────────────
const CATEGORY_RULES: { name: string; parent: string; type: 'expense'|'income'; keywords: RegExp }[] = [
  // Alimentação
  { name:'Supermercado',       parent:'Alimentação',       type:'expense', keywords:/mercado|supermercado|atacad|compras de casa|compra de mercado/ },
  { name:'Feira / Hortifruti', parent:'Alimentação',       type:'expense', keywords:/feira|hortifruti|verdura|legume|fruta/ },
  { name:'Açougue / Peixaria', parent:'Alimentação',       type:'expense', keywords:/a[cç]ougue|peixaria|carne|frango|peixe/ },
  { name:'Padaria',            parent:'Alimentação',       type:'expense', keywords:/padaria|pão|p[ãa]o/ },
  { name:'Restaurante',        parent:'Alimentação',       type:'expense', keywords:/restaurante|almo[çc]o|jantar|rod[íi]zio|pizzaria|sushi|hamburguer|lanchonete/ },
  { name:'Delivery',           parent:'Alimentação',       type:'expense', keywords:/delivery|ifood|i-food|rappi|uber\s*eat|pedido.*comida|comida.*pedido/ },
  { name:'Café / Cafeteria',   parent:'Alimentação',       type:'expense', keywords:/caf[eé]|cafeteria|cappuccino|expresso/ },
  { name:'Bar / Bebidas',      parent:'Alimentação',       type:'expense', keywords:/bar\b|cerveja|bebida|boteco|drinks?/ },
  // Transporte
  { name:'Combustível',        parent:'Transporte',        type:'expense', keywords:/gasolina|combust[íi]vel|etanol|[áa]lcool|posto|abastecer|abasteci/ },
  { name:'Uber / 99 / Taxi',   parent:'Transporte',        type:'expense', keywords:/uber|taxi|t[áa]xi|99\b|cabify|corrida/ },
  { name:'Ônibus / Metrô',     parent:'Transporte',        type:'expense', keywords:/[oô]nibus|metr[oô]|trem|passagem|bilhete|vt\b|vale.*transporte/ },
  { name:'Estacionamento',     parent:'Transporte',        type:'expense', keywords:/estacionamento|estacion/ },
  { name:'Manutenção Veículo', parent:'Transporte',        type:'expense', keywords:/mec[âa]nico|funilaria|pneu|revis[ãa]o.*carro|borracharia|troca.*[oó]leo/ },
  { name:'IPVA',               parent:'Transporte',        type:'expense', keywords:/ipva/ },
  { name:'Seguro Auto',        parent:'Transporte',        type:'expense', keywords:/seguro.*carro|seguro.*auto|seguro.*ve[íi]culo/ },
  { name:'Pedágio',            parent:'Transporte',        type:'expense', keywords:/ped[áa]gio/ },
  // Moradia
  { name:'Aluguel',            parent:'Moradia',           type:'expense', keywords:/aluguel/ },
  { name:'Condomínio',         parent:'Moradia',           type:'expense', keywords:/condom[íi]nio/ },
  { name:'Energia Elétrica',   parent:'Moradia',           type:'expense', keywords:/energia|conta.*luz|luz\b|celpe|copel|cemig|coelba|eletric|enel/ },
  { name:'Água / Saneamento',  parent:'Moradia',           type:'expense', keywords:/[áa]gua|saneamento|sabesp|cedae|embasa|caern/ },
  { name:'Gás',                parent:'Moradia',           type:'expense', keywords:/g[áa]s\b/ },
  { name:'Internet',           parent:'Moradia',           type:'expense', keywords:/internet|wi-fi|wifi|banda larga|fibra/ },
  { name:'TV por Assinatura',  parent:'Moradia',           type:'expense', keywords:/tv.*assina|sky\b|claro.*tv|net\b|vivo.*tv/ },
  { name:'Manutenção Casa',    parent:'Moradia',           type:'expense', keywords:/conserto|reparo|manuten[cç][aã]o.*casa|pedreiro|encanador|eletricista/ },
  // Saúde
  { name:'Plano de Saúde',     parent:'Saúde',             type:'expense', keywords:/plano.*sa[úu]de|conv[eê]nio|unimed|amil|hapvida|sulamerica.*sa[úu]de/ },
  { name:'Médico / Consulta',  parent:'Saúde',             type:'expense', keywords:/m[eé]dic[ao]|consulta|cl[íi]nica|hospital|pronto.*socorro/ },
  { name:'Dentista',           parent:'Saúde',             type:'expense', keywords:/dentist|odonto|dent/ },
  { name:'Farmácia',           parent:'Saúde',             type:'expense', keywords:/farm[áa]cia|rem[eé]dio|medic[ae]|drogaria|droga\b/ },
  { name:'Academia',           parent:'Saúde',             type:'expense', keywords:/academia|gym|muscula[cç][aã]o|crossfit|pilates|yoga/ },
  { name:'Psicólogo',          parent:'Saúde',             type:'expense', keywords:/psic[oó]logo|terapia|psicanalist/ },
  { name:'Exames / Laboratório',parent:'Saúde',            type:'expense', keywords:/exame|laborat[oó]rio|raio.*x|ultrassom|ressonância/ },
  // Educação
  { name:'Escola / Colégio',   parent:'Educação',          type:'expense', keywords:/escola|col[eé]gio|mensalidade.*escola|creche/ },
  { name:'Faculdade',          parent:'Educação',          type:'expense', keywords:/faculdade|universidade|mensalidade.*faculdade|graduação|p[oó]s.*gradua/ },
  { name:'Cursos Online',      parent:'Educação',          type:'expense', keywords:/curso|udemy|hotmart|coursera|alura|educa[cç][aã]o/ },
  { name:'Livros',             parent:'Educação',          type:'expense', keywords:/livro|amazon.*livro/ },
  { name:'Idiomas',            parent:'Educação',          type:'expense', keywords:/ingl[eê]s|espanhol|idioma|aula.*idioma|wizard|ccaa|fisk/ },
  // Lazer
  { name:'Streaming',          parent:'Lazer',             type:'expense', keywords:/netflix|spotify|amazon.*prime|disney|hbo|youtube.*premium|deezer|paramount/ },
  { name:'Cinema / Teatro',    parent:'Lazer',             type:'expense', keywords:/cinema|teatro|ingresso/ },
  { name:'Shows / Eventos',    parent:'Lazer',             type:'expense', keywords:/show\b|evento|festa|balada|concert/ },
  { name:'Viagem / Hospedagem',parent:'Lazer',             type:'expense', keywords:/viagem|hotel|pousada|airbnb|hospedagem|passagem.*a[eé]rea/ },
  { name:'Games / Jogos',      parent:'Lazer',             type:'expense', keywords:/game|jogo|playstation|xbox|nintendo|steam/ },
  { name:'Esportes',           parent:'Lazer',             type:'expense', keywords:/futebol|basquete|tenis\b|natação|esporte/ },
  // Cuidados Pessoais
  { name:'Cuidados Pessoais',  parent:'Cuidados Pessoais', type:'expense', keywords:/sal[aã]o|barbearia|corte.*cabelo|manicure|pedicure|est[eé]tica|cosm[eé]tico|perfume|maquiagem/ },
  // Pets
  { name:'Ração / Petisco',    parent:'Pets',              type:'expense', keywords:/ra[cç][aã]o|petisco|comida.*pet|cachorro|gato|bicho/ },
  { name:'Veterinário',        parent:'Pets',              type:'expense', keywords:/veterin[áa]rio|vet\b|cl[íi]nica.*animal/ },
  { name:'Banho e Tosa',       parent:'Pets',              type:'expense', keywords:/banho.*tosa|tosa|pet.*shop/ },
  // Tecnologia
  { name:'Celular / Plano',    parent:'Tecnologia',        type:'expense', keywords:/celular|smartphone|plano.*celular|tim\b|claro\b|vivo\b|oi\b/ },
  { name:'Software / Apps',    parent:'Tecnologia',        type:'expense', keywords:/software|app\b|assinatura.*app|microsoft|adobe|antiv[íi]rus/ },
  // Finanças
  { name:'Cartão de Crédito',  parent:'Finanças',          type:'expense', keywords:/cart[aã]o.*cr[eé]dito|fatura.*cart[aã]o|cart[aã]o.*fatura/ },
  { name:'Empréstimo',         parent:'Finanças',          type:'expense', keywords:/empr[eé]stimo|financiamento/ },
  { name:'Juros / Multas',     parent:'Finanças',          type:'expense', keywords:/juros|multa|taxa/ },
  // Presentes
  { name:'Presentes',          parent:'Presentes',         type:'expense', keywords:/presente|presente.*aniversário|gift|brinde/ },
  // Receitas
  { name:'Salário',            parent:'Trabalho',          type:'income',  keywords:/sal[áa]rio|pagamento.*sal[áa]rio|contracheque|holerite|pix.*sal[áa]rio/ },
  { name:'13º Salário',        parent:'Trabalho',          type:'income',  keywords:/13[oº°]|d[eé]cimo.*terceiro/ },
  { name:'Férias',             parent:'Trabalho',          type:'income',  keywords:/f[eé]rias/ },
  { name:'Bônus / PLR',        parent:'Trabalho',          type:'income',  keywords:/b[oô]nus|plr|part.*lucro|premia[cç][aã]o/ },
  { name:'Freelance',          parent:'Trabalho',          type:'income',  keywords:/freelance|freela|projeto.*receb|presta[cç][aã]o.*servi[cç]o/ },
  { name:'Comissão',           parent:'Trabalho',          type:'income',  keywords:/comiss[aã]o/ },
  { name:'Venda Online',       parent:'Negócios',          type:'income',  keywords:/venda.*online|mercadolivre|shopee|magalu|ifood.*receb|loja.*virtual/ },
  { name:'Aluguel Recebido',   parent:'Patrimônio',        type:'income',  keywords:/aluguel.*receb|recebi.*aluguel/ },
  { name:'Dividendos',         parent:'Investimentos',     type:'income',  keywords:/dividendo|rendimento|juros.*receb|aplicação.*rendeu/ },
  { name:'Restituição IR',     parent:'Benefícios',        type:'income',  keywords:/restituição|imposto.*renda.*receb|ir.*receb/ },
  { name:'Vale Alimentação',   parent:'Benefícios',        type:'income',  keywords:/vale.*alimenta[cç][aã]o|vr\b|vt\b|vale.*refei/ },
  { name:'FGTS',               parent:'Benefícios',        type:'income',  keywords:/fgts/ },
]

function detectAccountType(text: string): string | null {
  const t = text.toLowerCase()
  if (/cart[aã]o|cr[eé]dito|visa|master|elo/.test(t))                            return 'credit_card'
  if (/carteira|dinheiro|esp[eé]cie|caixa/.test(t))                              return 'cash'
  if (/poupan[cç]a/.test(t))                                                     return 'savings'
  if (/nubank|bradesco|ita[uú]|bb\b|caixa.*federal|santander|inter\b|c6|banco/.test(t)) return 'checking'
  return null
}

function parseVoiceInput(text: string) {
  const t = text.toLowerCase().trim()

  // Tipo
  let type: 'expense' | 'income' = 'expense'
  if (/recebi|recebei|entrou|ganhei|sal[áa]rio|renda|rendimento|lucro/.test(t)) type = 'income'

  // Valor
  const amount = parsePtBRAmount(t)

  // Data
  const today = new Date()
  let date = today.toISOString().split('T')[0]
  if (/ontem/.test(t))      { const d = new Date(); d.setDate(d.getDate()-1); date = d.toISOString().split('T')[0] }
  if (/anteontem/.test(t))  { const d = new Date(); d.setDate(d.getDate()-2); date = d.toISOString().split('T')[0] }

  // Categoria
  const rule = CATEGORY_RULES.find(r => r.type === type && r.keywords.test(t))
  const suggestedCategoryName = rule?.name ?? ''
  const suggestedParentName   = rule?.parent ?? ''

  // Conta
  const suggestedAccountType = detectAccountType(t)

  // Descrição limpa
  let description = t
    .replace(/gastei|paguei|comprei|recebi|recebei|ganhei|fiz\s+pix|pix\s+de|pix\s+para/g, '')
    .replace(/r\$\s*[\d.,]+/g, '')
    .replace(/\b\d+[\d.,]*\s*(?:reais?|conto|mil|k)?\b/g, '')
    .replace(/\b(zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos?|trezentos?|quinhentos?|mil)\b/g, '')
    .replace(/\b(de|do|da|no|na|em|com|e|hoje|ontem|anteontem)\b/g, ' ')
    .replace(/\s+/g, ' ').trim()

  if (!description || description.length < 2)
    description = suggestedCategoryName || (type === 'income' ? 'Receita' : 'Gasto')

  description = description.charAt(0).toUpperCase() + description.slice(1)

  return {
    type, amount, description, date,
    suggestedCategoryName, suggestedParentName,
    suggestedAccountType,
    original: text,
    confidence: amount > 0 ? 'high' : 'low',
  }
}

// POST /api/pf/voice — interpreta texto
export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  return NextResponse.json(parseVoiceInput(text))
}

// PUT /api/pf/voice — salva lançamento por voz (auto-confirm)
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { text, account_id } = body

  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })

  const parsed = parseVoiceInput(text)
  if (parsed.amount === 0) return NextResponse.json({ error: 'Valor não detectado', parsed }, { status: 422 })

  // Resolve categoria — busca existente ou cria
  let categoryId: string | null = null
  if (parsed.suggestedCategoryName) {
    const { data: existing } = await supabaseAdmin
      .from('pf_categories')
      .select('id')
      .ilike('name', parsed.suggestedCategoryName)
      .single()

    if (existing) {
      categoryId = existing.id
    } else {
      // Busca parent
      let parentId: string | null = null
      if (parsed.suggestedParentName) {
        const { data: parent } = await supabaseAdmin
          .from('pf_categories')
          .select('id')
          .ilike('name', parsed.suggestedParentName)
          .single()
        parentId = parent?.id ?? null
      }
      // Cria subcategoria automaticamente
      const { data: newCat } = await supabaseAdmin
        .from('pf_categories')
        .insert([{ name: parsed.suggestedCategoryName, type: parsed.type, color: '#6b7280', parent_id: parentId }])
        .select().single()
      categoryId = newCat?.id ?? null
    }
  }

  // Resolve conta
  let resolvedAccountId = account_id || null
  if (!resolvedAccountId && parsed.suggestedAccountType) {
    const { data: acc } = await supabaseAdmin
      .from('pf_accounts')
      .select('id')
      .eq('type', parsed.suggestedAccountType)
      .limit(1)
      .single()
    resolvedAccountId = acc?.id ?? null
  }
  if (!resolvedAccountId) {
    const { data: firstAcc } = await supabaseAdmin
      .from('pf_accounts')
      .select('id')
      .limit(1)
      .single()
    resolvedAccountId = firstAcc?.id ?? null
  }

  // Salva lançamento
  const { data, error } = await supabaseAdmin
    .from('pf_transactions')
    .insert([{
      type:        parsed.type,
      description: parsed.description,
      amount:      parsed.amount,
      date:        parsed.date,
      account_id:  resolvedAccountId,
      category_id: categoryId,
      status:      'confirmed',
      recurrence:  'single',
      voice_input: text,
    }])
    .select('*, account:pf_accounts(name), category:pf_categories(name,icon)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, transaction: data, parsed, categoryCreated: !categoryId })
}
