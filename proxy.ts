// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getDashboardPath } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/api/auth/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow public API paths (book search)
  if (pathname.startsWith('/api/librarian/books') && request.method === 'GET') {
    return NextResponse.next()
  }

  const token = request.cookies.get('univa_token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = verifyToken(token)

  if (!user) {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('univa_token')
    return response
  }

  // Redirect to correct dashboard if at root dashboard
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url))
  }

  // Role-based path protection
  const rolePaths: Record<string, string[]> = {
    '/dashboard/student': ['STUDENT'],
    '/dashboard/professor': ['PROFESSOR'],
    '/dashboard/librarian': ['LIBRARIAN'],
    '/dashboard/cook': ['COOK'],
    '/dashboard/server': ['CANTEEN_SERVER'],
    '/dashboard/admin': ['ADMIN'],
  }

  for (const [path, allowedRoles] of Object.entries(rolePaths)) {
    if (pathname.startsWith(path) && !allowedRoles.includes(user.role)) {
      return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url))
    }
  }

  // Refresh token TTL on activity
  const response = NextResponse.next()
  response.cookies.set('univa_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
