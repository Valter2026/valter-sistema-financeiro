/**
 * sync.mjs — Importa TODAS as vendas da Eduzz para o Supabase
 * Rode UMA VEZ da sua máquina: node scripts/sync.mjs
 */

import { createClient } from '@supabase/supabase-js'

const EDUZZ_BASE    = 'https://api2.eduzz.com'
const EDUZZ_EMAIL   = 'valter@eurosolucoes.com'
const EDUZZ_PUBLIC  = '96482672'
const EDUZZ_APIKEY  = 'C52473E6AB'
const SUPABASE_URL  = 'https://pkokvlxwldjnbededoeo.supabase.co'
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb2t2bHh3bGRqbmJlZGVkb2VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2MDY4NSwiZXhwIjoyMDg5NjM2Njg1fQ.K_pnznduZ_W2ShARzbOeS7uzYeHBVYluJPHSS-xj9GI'

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function getToken() {
  const res  = await fetch(`${EDUZZ_BASE}/credential/generate_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EDUZZ_EMAIL, publickey: EDUZZ_PUBLIC, apikey: EDUZZ_APIKEY }),
  })
  const data = await res.json()
  if (!data.success) throw new Error('Auth falhou: ' + JSON.stringify(data))
  console.log('✓ Token gerado')
  return data.data.token
}

async function fetchPage(token, page, start, end, attempt = 1) {
  const url = `${EDUZZ_BASE}/sale/get_sale_list?page=${page}&rows=100&start_date=${start}&end_date=${end}`
  const res  = await fetch(url, { headers: { token, PublicKey: EDUZZ_PUBLIC } })

  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch {
    if (attempt <= 3) {
      console.log(`  ⚠️  Resposta inválida (HTML?), tentativa ${attempt}/3, aguardando 5s...`)
      await sleep(5000)
      return fetchPage(token, page, start, end, attempt + 1)
    }
    console.log(`  ✗ Falha após 3 tentativas para ${start}→${end} p${page}`)
    return []
  }

  if (!data.success) {
    if (res.status === 429) {
      console.log('  ⏳ Rate limit, aguardando 5s...')
      await sleep(5000)
      return fetchPage(token, page, start, end, attempt)
    }
    return []
  }
  return data.data ?? []
}

function toRow(s) {
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

async function syncMonth(token, start, end) {
  console.log(`\n📅 Sincronizando ${start} → ${end}`)
  const all = []
  let page   = 1

  while (true) {
    process.stdout.write(`  Página ${page}... `)
    const rows = await fetchPage(token, page, start, end)
    console.log(`${rows.length} registros`)
    if (rows.length === 0) break
    all.push(...rows)
    if (rows.length < 25) break
    page++
    await sleep(500) // evita rate limit
  }

  if (all.length === 0) return 0

  // Deduplica por sale_id dentro do lote (evita "ON CONFLICT DO UPDATE command cannot affect row a second time")
  const unique = [...new Map(all.map(s => [s.sale_id, toRow(s)])).values()]

  // Upsert em lotes de 100
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100)
    const { error } = await db.from('sales').upsert(batch, { onConflict: 'sale_id' })
    if (error) console.error('  ✗ Erro ao salvar lote:', error.message)
  }

  console.log(`  ✓ ${unique.length} vendas salvas (${all.length} brutas, dedup aplicado)`)
  return unique.length
}

async function main() {
  console.log('🚀 Iniciando sincronização Eduzz → Supabase\n')

  const token = await getToken()
  let total   = 0

  // Sincroniza mês a mês de Jan/2024 até hoje
  const now   = new Date()
  const start = new Date(2024, 0, 1) // Jan 2024
  let cur     = new Date(start)

  while (cur <= now) {
    const y   = cur.getFullYear()
    const m   = cur.getMonth()
    const s   = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const e   = new Date(y, m + 1, 0).toISOString().split('T')[0]
    const end = e > now.toISOString().split('T')[0] ? now.toISOString().split('T')[0] : e

    const n = await syncMonth(token, s, end)
    total  += n
    cur     = new Date(y, m + 1, 1)
  }

  console.log(`\n✅ Sincronização completa! ${total} vendas importadas.`)
}

main().catch(console.error)
