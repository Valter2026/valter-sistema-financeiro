import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 30

// Eduzz envia POST para este endpoint a cada nova venda
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Valida Origin Key da Eduzz
    const originKey = req.headers.get('origin-key') ?? body.origin_key ?? ''
    if (originKey !== process.env.EDUZZ_ORIGIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const s = body
    const row = {
      sale_id:             s.sale_id || s.id,
      date_create:         s.date_create     || null,
      date_payment:        s.date_payment    || null,
      date_credit:         s.date_credit     || null,
      sale_status:         s.sale_status     || s.status,
      sale_status_name:    s.sale_status_name,
      sale_total:          parseFloat(s.sale_total      || '0'),
      sale_amount_win:     parseFloat(s.sale_amount_win || '0'),
      sale_fee:            Math.abs(parseFloat(s.sale_fee  || '0')),
      sale_coop:           parseFloat(s.sale_coop       || '0'),
      sale_payment_method: s.sale_payment_method,
      client_name:         s.client_name,
      client_email:        s.client_email,
      content_id:          s.content_id,
      content_title:       s.content_title,
      utm_source:          s.utm_source  || null,
      utm_campaign:        s.utm_campaign || null,
      utm_medium:          s.utm_medium  || null,
      utm_content:         s.utm_content || null,
      installments:        s.installments || 1,
      user_id:             'e44febb8-9d4a-4a8c-9f90-374ad564fa0c',
    }

    const { error } = await supabaseAdmin
      .from('sales')
      .upsert(row, { onConflict: 'sale_id' })

    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
