import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const PROMPT = `Analise esta imagem (comprovante de pagamento, nota fiscal, cupom fiscal, boleto ou recibo) e extraia as informações financeiras.

Retorne SOMENTE o JSON abaixo, sem nenhum texto adicional:

{
  "document_type": "comprovante_pagamento | cupom_fiscal | nota_fiscal_venda | nota_fiscal_servico | boleto | recibo | outro",
  "transaction_type": "expense | income",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "due_date": null,
  "description": "descrição curta do que foi pago/recebido",
  "seller_or_payer": "nome do estabelecimento, empresa ou pessoa",
  "payment_method": "pix | cartao_credito | cartao_debito | dinheiro | boleto | transferencia | outro",
  "status": "confirmed | pending",
  "category_suggestion": "nome sugerido para categoria",
  "items": [],
  "notes": ""
}

Regras obrigatórias:
- nota_fiscal_venda ou PIX/TED recebido → transaction_type = "income"
- cupom_fiscal de compra, boleto pago, comprovante de pagamento → transaction_type = "expense"
- Se tiver data de vencimento futura (ainda não venceu hoje) → status = "pending" e preencha due_date
- Se o pagamento já foi efetuado/confirmado → status = "confirmed"
- amount: valor total final com ponto como decimal (ex: 150.90)
- date: data da transação ou emissão no formato YYYY-MM-DD
- items: até 5 itens principais do cupom/nota (ou array vazio)
- Se não encontrar um campo, use null ou "" conforme o tipo`

export async function POST(req: NextRequest) {
  const { image, mimeType = 'image/jpeg' } = await req.json()

  if (!image) return NextResponse.json({ error: 'Imagem não enviada' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: image,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extrai JSON da resposta (ignora texto antes/depois)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('IA não retornou JSON válido')

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ok: true, data: extracted })
  } catch (e: any) {
    console.error('[OCR]', e)
    return NextResponse.json({ error: e.message || 'Erro ao processar imagem' }, { status: 500 })
  }
}
