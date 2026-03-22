import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days  = parseInt(searchParams.get('days') ?? '3')
  const today = new Date()
  const limit = new Date(); limit.setDate(today.getDate() + days)

  const todayStr = today.toISOString().split('T')[0]
  const limitStr = limit.toISOString().split('T')[0]

  const { data, error } = await supabaseAdmin
    .from('pf_transactions')
    .select('id, description, amount, date, category:pf_categories(name,icon), account:pf_accounts(name)')
    .in('status', ['pending', 'scheduled'])
    .gte('date', todayStr)
    .lte('date', limitStr)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bills = data ?? []
  const total = bills.reduce((a: number, t: any) => a + Number(t.amount), 0)

  // Envio de email via Resend (opcional — só funciona se RESEND_API_KEY e NOTIFY_EMAIL estiverem configurados)
  const sendEmail = searchParams.get('send') === '1'
  let emailSent   = false

  if (sendEmail && bills.length > 0 && process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    const rows = bills.map((b: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1f2937;color:#d1d5db;">
          ${new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR')}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #1f2937;color:#f9fafb;font-weight:600;">
          ${b.category?.icon ?? ''} ${b.description || b.category?.name || '—'}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #1f2937;color:#f87171;font-weight:700;text-align:right;">
          R$ ${Number(b.amount).toFixed(2).replace('.',',')}
        </td>
      </tr>`).join('')

    const html = `
      <div style="font-family:sans-serif;background:#030712;padding:32px;">
        <div style="max-width:520px;margin:0 auto;background:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">
          <div style="background:#059669;padding:20px 24px;">
            <h1 style="color:#fff;margin:0;font-size:18px;">💰 Contas vencendo em ${days} dia(s)</h1>
          </div>
          <div style="padding:24px;">
            <p style="color:#9ca3af;font-size:14px;margin:0 0 16px;">
              Você tem <strong style="color:#fff;">${bills.length} conta(s)</strong> a pagar nos próximos ${days} dia(s).
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#1f2937;">
                  <th style="padding:8px 12px;color:#6b7280;text-align:left;font-weight:600;">Data</th>
                  <th style="padding:8px 12px;color:#6b7280;text-align:left;font-weight:600;">Descrição</th>
                  <th style="padding:8px 12px;color:#6b7280;text-align:right;font-weight:600;">Valor</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr style="background:#1f2937;">
                  <td colspan="2" style="padding:10px 12px;color:#d1d5db;font-weight:700;">Total</td>
                  <td style="padding:10px 12px;color:#f87171;font-weight:700;text-align:right;">
                    R$ ${total.toFixed(2).replace('.',',')}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p style="color:#6b7280;font-size:12px;margin:16px 0 0;">Acesse suas finanças para marcar como pago.</p>
          </div>
        </div>
      </div>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Finanças <financas@resend.dev>',
        to:   [process.env.NOTIFY_EMAIL],
        subject: `💰 ${bills.length} conta(s) vencendo em ${days} dia(s) — R$ ${total.toFixed(2).replace('.',',')}`,
        html,
      }),
    })
    emailSent = true
  }

  return NextResponse.json({ bills, total, count: bills.length, emailSent, days })
}
