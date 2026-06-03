import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── Session refresh (required by @supabase/ssr) ───────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthRoute = pathname === '/login' || pathname === '/cadastro'
  const isProtectedRoute =
    pathname === '/inicio' ||
    pathname.startsWith('/inicio/') ||
    pathname === '/palpite' ||
    pathname.startsWith('/palpite/') ||
    pathname === '/ranking' ||
    pathname.startsWith('/ranking/') ||
    pathname === '/desempate' ||
    pathname.startsWith('/desempate/') ||
    pathname === '/perfil' ||
    pathname.startsWith('/perfil/') ||
    pathname === '/pagamento' ||
    pathname.startsWith('/pagamento/') ||
    pathname === '/regras' ||
    pathname.startsWith('/regras/') ||
    pathname.startsWith('/admin')

  // Unauthenticated → login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated on auth page → app
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/inicio'
    return NextResponse.redirect(url)
  }

  // Admin role check is NOT done here — user_roles has restrictive RLS
  // that blocks direct queries. The check is handled server-side in
  // app/admin/layout.tsx using supabase.rpc('is_admin') (SECURITY DEFINER).

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
