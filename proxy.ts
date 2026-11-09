import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedPaths = ['/', '/clients', '/packages', '/activity', '/team', '/settings'];
const authPaths = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('auth-token')?.value;
    const user = token ? await verifyToken(token) : null;
 
    const isProtected = protectedPaths.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    const isAuthPath = authPaths.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthPath && user) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error('Proxy error caught:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
