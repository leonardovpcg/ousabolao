import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    const isAuthRoute =
      pathname === '/login' ||
      pathname === '/cadastro'

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

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/inicio'
      return NextResponse.redirect(url)
    }

    return response
  } catch {
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
