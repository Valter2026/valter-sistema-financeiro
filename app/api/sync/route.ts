import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

const EDUZZ_BASE   = 'https://api2.eduzz.com'
const EDUZZ_EMAIL  = process.env.EDUZZ_EMAIL!
const EDUZZ_PUBLIC = process.env.EDUZZ_PUBLIC_KEY!
const EDUZZ_APIKEY = process.env.EDUZZ_API_KEY!

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function getToken(): Promise<string> {
  const res  = await fetch(`${EDUZZ_BASE}/credential/generate_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EDUZZ_EMAIL, publickey: EDUZZ_PUBLIC, apikey: EDUZZ_APIKEY }),
  })
  const data = await res.json()
  if (!data.success) throw new Error('Auth Eduzz falhou')
  return data.data.token
}

async function fetchPage(token: string, page: number, start: string, end: string): Promise<any[]> {
  const url = `${EDUZZ_BASE}/sale/get_sale_list?page=${page}&rows=100&start_date=${start}&end_date=${end}`
  const res  = await fetch(url, { headers: { token, PublicKey: EDUZZ_PUBLIC } })
  if (res.status === 429) { await sleep(3000); return fetchPage(token, page, start, end) }
  const data = await res.json()
  if (!data.success) return []
  return data.data ?? []
}

function toRow(s: any) {
  return {
    sale_id:             s.sale_id,
    date_create:         s.date_create     || null,
    date_payment:        s.date_payment    || null,
    date_credit:         s.date_credit     || null,
    sale_status:         s.sale_status,
    sale_status_name:    s.sale_status_name,
    sale_total:          parseFloat(s.sale_total      || '0'),
    sale_amount_win:     parseFloat(s.sale_amount_win || '0'),
    sale_fee:            Math.abs(parseFloat(s.sale_fee || '0')),
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
  }
}

// Sincroniza os últimos N dias (padrão: 3 dias para pegar mudanças de status)
async function syncPeriod(token: string, start: string, end: string): Promise<number> {
  const all: any[] = []
  let page = 1

  while (true) {
    const rows = await fetchPage(token, page, start, end)
    if (rows.length === 0) break
    all.push(...rows)
    if (rows.length < 25) break
    page++
    await sleep(300)
  }

  if (all.length === 0) return 0

  // Deduplica por sale_id
  const unique = [...new Map(all.map(s => [s.sale_id, toRow(s)])).values()]

  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100)
    await supabaseAdmin.from('sales').upsert(batch, { onConflict: 'sale_id' })
  }

  return unique.length
}

export async function GET(req: NextRequest) {
  // Verifica chave de segurança para chamadas manuais
  const key = req.headers.get('x-cron-key') ?? new URL(req.url).searchParams.get('key') ?? ''
  const cronKey = process.env.CRON_SECRET ?? ''
  if (cronKey && key !== cronKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url         = new URL(req.url)
  const userId      = url.searchParams.get('user_id')
  const customStart = url.searchParams.get('start')
  const customEnd   = url.searchParams.get('end')

  try {
    const token = await getToken()
    const fmt   = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

    let totalSynced = 0

    if (customStart && customEnd) {
      // Sync de período específico: ?start=2024-01-01&end=2024-06-30
      totalSynced = await syncPeriod(token, customStart, customEnd)
    } else {
      // Sync incremental: últimos 3 dias
      const end   = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 3)
      totalSynced = await syncPeriod(token, fmt(start), fmt(end))
    }

    // Vincular user_id nos registros sem dono
    if (userId) {
      await supabaseAdmin.from('sales').update({ user_id: userId }).is('user_id', null)
    }

    return NextResponse.json({ ok: true, synced: totalSynced, start: customStart, end: customEnd })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
