import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { supabase } = await requireAuth()
  const { data } = await supabase
    .from('pf_advisor_schedule')
    .select('*')
    .eq('id', 1)
    .single()
  return NextResponse.json(data ?? {})
}

export async function PUT(req: NextRequest) {
  const { supabase } = await requireAuth()
  const body = await req.json()
  const { error } = await supabase
    .from('pf_advisor_schedule')
    .upsert({ id: 1, ...body })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
