import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Edge middleware cannot read JWT from localStorage; portal layouts use AuthGate / PortalGuard.
 * This layer handles legacy `/org` → `/merchant` aliases and optional `next` hints for login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/org' || pathname.startsWith('/org/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/^\/org/, '/merchant') || '/merchant'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/merchant/:path*', '/org/:path*'],
}
