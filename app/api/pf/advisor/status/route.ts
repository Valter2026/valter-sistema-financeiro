import { NextResponse } from 'next/server'

export async function GET() {
  const raw = process.env.ANTHROPIC_API_KEY ?? ''
  const key = raw.trim()
  return NextResponse.json({
    configured: !!key,
    length_raw:     raw.length,
    length_trimmed: key.length,
    first_20: key.slice(0, 20),
    last_10:  key.slice(-10),
    first_char_code: raw.charCodeAt(0),
    last_char_code:  raw.charCodeAt(raw.length - 1),
    has_quotes: raw.startsWith('"') || raw.startsWith("'"),
  })
}
