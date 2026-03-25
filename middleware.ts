import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/termos', '/privacidade']
const API_PUBLIC   = ['/api/webhook']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas de API públicas (webhooks de pagamento)
  if (API_PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Rotas de API internas (cron, etc.) protegidas por secret header
  if (pathname.startsWith('/api/fin/cron') || pathname.startsWith('/api/pf/cron')) {
    const secret = request.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()             { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verifica sessão
  const { data: { user } } = await supabase.auth.getUser()

  // Rotas públicas de UI — se já autenticado, redireciona para dashboard
  if (PUBLIC_PATHS.includes(pathname)) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
    return response
  }

  // Rotas de API — retorna 401 se não autenticado (exceto rotas já tratadas acima)
  if (pathname.startsWith('/api/')) {
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    return response
  }

  // Todas as outras rotas — redireciona para login se não autenticado
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
}
