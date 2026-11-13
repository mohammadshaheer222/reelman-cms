import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedPaths = ['/clients', '/packages', '/activity', '/team', '/settings'];
const authPaths = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  try {
    const { pathname, search } = request.nextUrl;

    // Skip _next internals and static assets
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    const token = request.cookies.get('auth-token')?.value;
    const user = token ? await verifyToken(token) : null;

    // Check if path is protected (dashboard routes + root)
    const isRoot = pathname === '/';
    const isProtected =
      isRoot ||
      protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

    // Check if on auth pages
    const isAuthPath = authPaths.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
      const loginUrl = new URL('/login', request.url);
      const fullPath = `${pathname}${search || ''}`;
      if (pathname !== '/') {
        loginUrl.searchParams.set('redirect', fullPath);
      }
      if (token) {
        loginUrl.searchParams.set('expired', 'true');
      }
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete('auth-token');
      }
      return response;
    }

    if (isAuthPath && user) {
      if (search.includes('expired=true') || search.includes('logout=true')) {
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isAuthPath && !user && token) {
      const response = NextResponse.next();
      response.cookies.delete('auth-token');
      return response;
    }

    return NextResponse.next();
  } catch {
    // On any error, let the request through — Next.js will handle it
    return NextResponse.next();
  }
}

export const config = {
  // Run on all pages, _next/static served by Vercel CDN won't reach here
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export const middleware = proxy;
export default proxy;
