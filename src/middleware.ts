import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

const publicPaths = ['/login', '/api/webhooks']
const protectedPaths = ['/dashboard', '/api/auth', '/api/orders', '/api/shipments', '/api/invoices', '/api/tenants']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip pentru assets statice
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Permite webhook-uri fără autentificare
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  // Verifică autentificarea pentru rute protejate
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath && !isPublicPath) {
    const session = await getSession()

    if (!session) {
      // Redirect la login pentru pagini
      if (!pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      // 401 pentru API
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // Redirect de la login dacă e deja autentificat
  if (pathname === '/login') {
    const session = await getSession()
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect de la root la dashboard dacă e autentificat
  if (pathname === '/') {
    const session = await getSession()
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
