import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runAdvisor, getFinancialContext } from '@/lib/pf-financial-context'

export async function GET(req: NextRequest) {
  const { supabase } = await requireAuth()
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const question = new URL(req.url).searchParams.get('q') ?? ''

  try {
    const ctx     = await getFinancialContext()
    const advices = await runAdvisor(question)

    // Se não for pergunta específica, atualiza o cache também
    if (!question) {
      await supabase.from('pf_advisor_cache').upsert({
        id: 1, advices, generated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ advices, context: ctx, generatedAt: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
