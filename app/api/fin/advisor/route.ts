import { NextRequest, NextResponse } from 'next/server'
import { runFinAdvisor, getFinancialContext } from '@/lib/fin-financial-context'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  try {
    const ctx     = await getFinancialContext()
    const advices = await runFinAdvisor(q)
    if (!q) {
      await supabaseAdmin.from('fin_advisor_cache')
        .upsert({ id: 1, advices, generated_at: new Date().toISOString() })
    }
    return NextResponse.json({ advices, context: ctx, generatedAt: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
