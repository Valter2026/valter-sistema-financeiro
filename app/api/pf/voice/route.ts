import { NextRequest, NextResponse } from 'next/server'

// Interpreta frases em português e extrai dados de lançamento
function parseVoiceInput(text: string) {
  const t = text.toLowerCase().trim()

  // Detecta tipo
  let type: 'expense' | 'income' = 'expense'
  if (/recebi|recebei|entrou|ganhei|salário|salario|renda/.test(t)) type = 'income'

  // Extrai valor
  let amount = 0
  const moneyPatterns = [
    /r\$\s*([\d.,]+)/,
    /([\d.,]+)\s*reais?/,
    /([\d.,]+)\s*conto/,
    /(\d+(?:[.,]\d+)?)\s*(?:de\s+)?(?:real|reais|r\$)?/,
  ]
  for (const p of moneyPatterns) {
    const m = t.match(p)
    if (m) {
      amount = parseFloat(m[1].replace(',', '.'))
      break
    }
  }

  // Extrai descrição — palavras após conectores comuns
  let description = ''
  const descPatterns = [
    /(?:gastei|paguei|comprei|gasto com|pago|no|na|em|com)\s+(?:r\$\s*[\d.,]+\s*(?:reais?)?\s*(?:no|na|em|com|de)?\s*)?(.+?)(?:\s+(?:hoje|ontem|agora|essa semana))?$/,
    /(.+?)\s+(?:r\$|reais?|\d+)/,
  ]
  for (const p of descPatterns) {
    const m = t.match(p)
    if (m && m[1] && m[1].length > 1) {
      description = m[1].replace(/[^a-záàâãéèêíïóôõúüç\s]/gi, '').trim()
      break
    }
  }
  if (!description) {
    // fallback: remove números e palavras-chave, pega o que sobra
    description = t
      .replace(/gastei|paguei|comprei|recebi|recebei|ganhei|r\$|reais?|conto/g, '')
      .replace(/[\d.,]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Detecta data
  const today = new Date().toISOString().split('T')[0]
  let date = today
  if (/ontem/.test(t)) {
    const d = new Date(); d.setDate(d.getDate() - 1)
    date = d.toISOString().split('T')[0]
  }

  // Sugere categoria por palavras-chave
  const categoryMap: Record<string, { name: string; keywords: RegExp }> = {
    'Supermercado':     { name: 'Supermercado',     keywords: /mercado|supermercado|compras de casa|hortifruti/ },
    'Restaurante':      { name: 'Restaurante',       keywords: /restaurante|almoço|almoco|jantar|lanche/ },
    'Delivery':         { name: 'Delivery',          keywords: /delivery|ifood|rappi|pedido/ },
    'Combustível':      { name: 'Combustível',       keywords: /gasolina|combustível|combustivel|posto|etanol|álcool|alcool/ },
    'Uber / Taxi':      { name: 'Uber / Taxi',       keywords: /uber|taxi|táxi|99|cabify/ },
    'Energia Elétrica': { name: 'Energia Elétrica',  keywords: /energia|luz|celpe|copel|cemig|eletric/ },
    'Internet':         { name: 'Internet',          keywords: /internet|wifi|banda larga|vivo|claro|tim|oi/ },
    'Aluguel':          { name: 'Aluguel',           keywords: /aluguel/ },
    'Farmácia':         { name: 'Saúde',             keywords: /farmácia|farmacia|remédio|remedio|medicamento/ },
    'Salário':          { name: 'Salário',           keywords: /salário|salario|pagamento|holerite/ },
    'Freelance':        { name: 'Freelance',         keywords: /freelance|freela|projeto|cliente/ },
  }

  let suggestedCategory = ''
  for (const [, cat] of Object.entries(categoryMap)) {
    if (cat.keywords.test(t)) { suggestedCategory = cat.name; break }
  }

  return { type, amount, description, date, suggestedCategory, original: text }
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  const result = parseVoiceInput(text)
  return NextResponse.json(result)
}
