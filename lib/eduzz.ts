const EDUZZ_BASE = 'https://api2.eduzz.com'

// ─── Cache de token ─────────────────────────────────────────────────────────
let cachedToken: string | null = null
let tokenExpiry = 0

export async function getEduzzToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetchWithRetry(`${EDUZZ_BASE}/credential/generate_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email:     process.env.EDUZZ_EMAIL,
      publickey: process.env.EDUZZ_PUBLIC_KEY,
      apikey:    process.env.EDUZZ_API_KEY,
    }),
    cache: 'no-store',
  })

  const data = await res.json()
  if (!data.success) throw new Error('Eduzz auth falhou: ' + JSON.stringify(data))

  cachedToken = data.data.token
  tokenExpiry = Date.now() + 9 * 60 * 1000
  return cachedToken!
}

// ─── Fetch com retry automático em caso de 429 ──────────────────────────────
async function fetchWithRetry(url: string, opts: RequestInit, maxRetries = 4): Promise<Response> {
  let lastRes: Response | null = null
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      // Backoff exponencial: 1s, 2s, 4s
      await sleep(1000 * Math.pow(2, attempt - 1))
    }
    const res = await fetch(url, opts)
    if (res.status !== 429) return res
    lastRes = res
  }
  return lastRes!
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ─── Cache em memória (só salva resultados com dados reais) ─────────────────
const salesCache = new Map<string, { data: EduzzSale[]; ts: number }>()
const CACHE_TTL  = 10 * 60 * 1000 // 10 minutos

// ─── Busca uma página com retry ─────────────────────────────────────────────
async function fetchPage(token: string, page: number, start: string, end: string): Promise<EduzzSale[]> {
  const url = new URL(`${EDUZZ_BASE}/sale/get_sale_list`)
  url.searchParams.set('page',       String(page))
  url.searchParams.set('rows',       '100')
  url.searchParams.set('start_date', start)
  url.searchParams.set('end_date',   end)

  const res = await fetchWithRetry(url.toString(), {
    headers: { token, PublicKey: process.env.EDUZZ_PUBLIC_KEY! },
    cache: 'no-store',
  })

  if (!res.ok) return []
  const data = await res.json()
  if (!data.success) return []
  return (data?.data ?? []) as EduzzSale[]
}

// ─── Busca todas as páginas de um intervalo com delay entre requisições ──────
async function fetchInterval(token: string, start: string, end: string): Promise<EduzzSale[]> {
  const all: EduzzSale[] = []
  let page = 1

  while (true) {
    if (page > 1) await sleep(300) // 300ms entre páginas — evita 429

    const rows = await fetchPage(token, page, start, end)
    if (rows.length === 0) break
    all.push(...rows)
    if (rows.length < 25) break
    page++
    if (page > 200) break
  }

  return all
}

// ─── Divide período longo em meses e busca sequencialmente ──────────────────
export async function getAllSales(startDate: string, endDate: string): Promise<EduzzSale[]> {
  const cacheKey = `${startDate}_${endDate}`
  const cached   = salesCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL && cached.data.length > 0) {
    return cached.data
  }

  const token     = await getEduzzToken()
  const intervals = splitIntoMonths(startDate, endDate)
  const all: EduzzSale[] = []

  for (const { start, end } of intervals) {
    const rows = await fetchInterval(token, start, end)
    all.push(...rows)
  }

  if (all.length > 0) {
    salesCache.set(cacheKey, { data: all, ts: Date.now() })
  }

  return all
}

// ─── Divide em intervalos mensais (períodos curtos ficam como estão) ─────────
function splitIntoMonths(start: string, end: string): { start: string; end: string }[] {
  const s = new Date(start)
  const e = new Date(end)
  const diffDays = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays <= 35) return [{ start, end }]

  const result: { start: string; end: string }[] = []
  let cur = new Date(s.getFullYear(), s.getMonth(), 1)

  while (cur <= e) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
    result.push({
      start: fmt(cur < s ? s : cur),
      end:   fmt(monthEnd > e ? e : monthEnd),
    })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    if (cur > e) break
  }

  return result
}

function fmt(d: Date) { return d.toISOString().split('T')[0] }

export async function getProductList() {
  const token = await getEduzzToken()
  const res   = await fetchWithRetry(`${EDUZZ_BASE}/content/content_list`, {
    headers: { token, PublicKey: process.env.EDUZZ_PUBLIC_KEY! },
    cache: 'no-store',
  })
  const data = await res.json()
  return data?.data ?? []
}

export async function getFinancialBalance() {
  const token = await getEduzzToken()
  const res   = await fetchWithRetry(`${EDUZZ_BASE}/financial/balance`, {
    headers: { token, PublicKey: process.env.EDUZZ_PUBLIC_KEY! },
    cache: 'no-store',
  })
  const data = await res.json()
  return data?.data ?? null
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface EduzzSale {
  sale_id:             number
  date_create:         string
  date_payment:        string | null
  date_credit:         string | null
  sale_status:         number
  sale_status_name:    string
  sale_total:          string
  sale_amount_win:     string
  sale_net_gain:       string
  sale_fee:            string
  sale_coop:           string
  sale_partner:        string
  sale_payment_method: string
  client_name:         string
  client_email:        string
  content_id:          number
  content_title:       string
  utm_source:          string
  utm_campaign:        string
  utm_medium:          string
  utm_content:         string
  installments:        number
}

// ─── Cálculo financeiro — apenas vendas PAGAS (status 3) ────────────────────
export function calcFinancials(sales: EduzzSale[]) {
  const pagas = sales.filter(s => s.sale_status === 3)
  const bruto    = pagas.reduce((a, s) => a + parseFloat(s.sale_total      || '0'), 0)
  const liquido  = pagas.reduce((a, s) => a + parseFloat(s.sale_amount_win || '0'), 0)
  const taxaPlat = pagas.reduce((a, s) => a + Math.abs(parseFloat(s.sale_fee  || '0')), 0)
  const taxaCoop = pagas.reduce((a, s) => a + parseFloat(s.sale_coop       || '0'), 0)
  return { bruto, liquido, totalTaxas: taxaPlat + taxaCoop, taxaPlat, taxaCoop, quantidade: pagas.length }
}
