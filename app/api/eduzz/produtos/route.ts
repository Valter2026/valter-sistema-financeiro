import { NextResponse } from 'next/server'
import { getProductList } from '@/lib/eduzz'

export async function GET() {
  try {
    const data = await getProductList()
    const produtos = data?.rows ?? data ?? []
    return NextResponse.json({ produtos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
