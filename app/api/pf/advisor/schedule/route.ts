import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('pf_advisor_schedule')
    .select('*')
    .eq('id', 1)
    .single()
  return NextResponse.json(data ?? {})
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { error } = await supabaseAdmin
    .from('pf_advisor_schedule')
    .upsert({ id: 1, ...body })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
