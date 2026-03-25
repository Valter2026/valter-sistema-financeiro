import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runFinMonthlyScript } from '@/lib/fin-financial-context'

export async function GET() {
  const { supabase } = await requireAuth()
  const { data } = await supabase
    .from('fin_advisor_scripts').select('script,generated_at').eq('type', 'monthly').single()
  if (data?.script) return NextResponse.json({ script: data.script, generated_at: data.generated_at })
  // Auto-generate if none exists
  try {
    const script = await runFinMonthlyScript()
    const now = new Date().toISOString()
    await supabase.from('fin_advisor_scripts')
      .upsert({ type: 'monthly', script, generated_at: now })
    return NextResponse.json({ script, generated_at: now })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST() {
  const { supabase } = await requireAuth()
  try {
    const script = await runFinMonthlyScript()
    const now = new Date().toISOString()
    await supabase.from('fin_advisor_scripts')
      .upsert({ type: 'monthly', script, generated_at: now })
    return NextResponse.json({ script, generated_at: now })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
