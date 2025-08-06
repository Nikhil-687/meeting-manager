import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup']
  
  // If user is not authenticated and trying to access protected route
  if (!token && !publicRoutes.includes(pathname) && pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user is authenticated and trying to access auth pages
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
