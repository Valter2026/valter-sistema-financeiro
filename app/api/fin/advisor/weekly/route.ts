import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runFinWeeklyScript } from '@/lib/fin-financial-context'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('fin_advisor_scripts').select('script,generated_at').eq('type', 'weekly').single()
  if (data?.script) return NextResponse.json({ script: data.script, generated_at: data.generated_at })
  // Auto-generate if none exists
  try {
    const script = await runFinWeeklyScript()
    const now = new Date().toISOString()
    await supabaseAdmin.from('fin_advisor_scripts')
      .upsert({ type: 'weekly', script, generated_at: now })
    return NextResponse.json({ script, generated_at: now })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const script = await runFinWeeklyScript()
    const now = new Date().toISOString()
    await supabaseAdmin.from('fin_advisor_scripts')
      .upsert({ type: 'weekly', script, generated_at: now })
    return NextResponse.json({ script, generated_at: now })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
