'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Loader2, BarChart3, Check, ArrowLeft } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">E-mail enviado!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Verifique sua caixa de entrada em <strong className="text-white">{email}</strong> e clique no link para redefinir sua senha.
          </p>
          <Link href="/login"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors">
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
          <p className="text-gray-400 text-sm mt-1">Enviaremos um link para o seu e-mail</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">E-mail da conta</label>
            <input type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Enviar link de recuperação'}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={13} /> Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
