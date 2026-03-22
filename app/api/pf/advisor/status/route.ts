import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  return NextResponse.json({
    configured: !!key,
    starts_with: key ? key.slice(0, 14) + '...' : null,
    length: key?.length ?? 0,
    has_spaces: process.env.ANTHROPIC_API_KEY !== key,
  })
}
