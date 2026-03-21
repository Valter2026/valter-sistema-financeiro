const EDUZZ_BASE = 'https://api2.eduzz.com'

let cachedToken: string | null = null
let tokenExpiry: number = 0

export async function getEduzzToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(`${EDUZZ_BASE}/credential/generate_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.EDUZZ_EMAIL,
      publickey: process.env.EDUZZ_PUBLIC_KEY,
      apikey: process.env.EDUZZ_API_KEY,
    }),
  })

  const data = await res.json()
  if (!data.success) throw new Error('Falha ao autenticar na Eduzz: ' + JSON.stringify(data))

  cachedToken = data.data.token
  tokenExpiry = Date.now() + 10 * 60 * 1000 // 10 minutos
  return cachedToken!
}

export async function eduzzGet(endpoint: string, params: Record<string, string> = {}) {
  const token = await getEduzzToken()
  const url = new URL(`${EDUZZ_BASE}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      token,
      'PublicKey': process.env.EDUZZ_PUBLIC_KEY!,
    },
  })

  const data = await res.json()
  if (!data.success) throw new Error(`Eduzz API error: ${JSON.stringify(data)}`)
  return data.data
}

export async function getSalesList(params: {
  start_date?: string
  end_date?: string
  page?: number
  rows?: number
} = {}) {
  return eduzzGet('/sale/get_sale_list', {
    page: String(params.page ?? 1),
    rows: String(params.rows ?? 100),
    ...(params.start_date && { start_date: params.start_date }),
    ...(params.end_date && { end_date: params.end_date }),
  })
}

export async function getProductList() {
  return eduzzGet('/content/content_list')
}

export async function getFinancialBalance() {
  return eduzzGet('/financial/balance')
}
