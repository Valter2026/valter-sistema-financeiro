import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY
  return NextResponse.json({
    configured: !!key,
    starts_with: key ? key.slice(0, 10) + '...' : null,
    length: key?.length ?? 0,
  })
}
