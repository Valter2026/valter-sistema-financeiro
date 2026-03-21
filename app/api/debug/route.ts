import { NextResponse } from 'next/server'

export async function GET() {
  const log: string[] = []
  try {
    log.push('1. Gerando token...')
    const authRes = await fetch('https://api2.eduzz.com/credential/generate_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:     process.env.EDUZZ_EMAIL,
        publickey: process.env.EDUZZ_PUBLIC_KEY,
        apikey:    process.env.EDUZZ_API_KEY,
      }),
      cache: 'no-store',
    })
    const authData = await authRes.json()
    if (!authData.success) return NextResponse.json({ log, step: 'auth_failed' })
    const token = authData.data.token
    log.push('2. Token OK')

    // Simula o loop de getAllSales para 7d
    const all: any[] = []
    let page = 1
    while (page <= 10) {
      log.push(`3.${page}. Buscando página ${page}...`)
      const url = `https://api2.eduzz.com/sale/get_sale_list?page=${page}&rows=100&start_date=2026-03-14&end_date=2026-03-21`
      const res = await fetch(url, {
        headers: { token, PublicKey: process.env.EDUZZ_PUBLIC_KEY! },
        cache: 'no-store',
      })
      if (!res.ok) { log.push(`ERRO HTTP ${res.status}`); break }
      const data = await res.json()
      if (!data.success) { log.push(`ERRO Eduzz: ${data.code} - ${data.details}`); break }
      const rows = data?.data ?? []
      all.push(...rows)
      log.push(`   → ${rows.length} registros (total: ${all.length})`)
      if (rows.length < 25) break
      page++
    }

    return NextResponse.json({ log, totalFetched: all.length })
  } catch (err: any) {
    return NextResponse.json({ log, error: err.message })
  }
}
