import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const auth = request.cookies.get('auth')
  if (!auth || auth.value !== '1') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
