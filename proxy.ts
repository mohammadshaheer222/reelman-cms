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

    // If staff user has disabled Home ('/'), redirect away from root to their first permitted route
    if (isRoot && user) {
      if (user.allowedNavItems && Array.isArray(user.allowedNavItems) && user.allowedNavItems.length > 0) {
        if (!user.allowedNavItems.includes('/')) {
          const target = user.allowedNavItems.find((p) => p !== '/') || user.allowedNavItems[0] || '/clients';
          return NextResponse.redirect(new URL(target, request.url));
        }
      }
    }

    if (isAuthPath && user) {
      if (search.includes('expired=true') || search.includes('logout=true')) {
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
      let target = '/';
      if (user.allowedNavItems && Array.isArray(user.allowedNavItems) && user.allowedNavItems.length > 0) {
        if (!user.allowedNavItems.includes('/')) {
          target = user.allowedNavItems.find((p) => p !== '/') || user.allowedNavItems[0] || '/clients';
        }
      }
      return NextResponse.redirect(new URL(target, request.url));
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
