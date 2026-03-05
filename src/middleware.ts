/**
 * Next.js edge middleware for Qyburn.
 * Handles auth redirects, security headers, and request logging.
 * Edge-compatible — no Node.js APIs (process.stdout, fs, etc.).
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Skip Paths ─────────────────────────────────────────────

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/sse',
  '/api/health',
  '/_next',
  '/favicon.ico',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

// ─── Security Headers ───────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// ─── Middleware ──────────────────────────────────────────────

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const start = Date.now();

  // Skip public / static paths
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // Auth check — look for NextAuth session token cookie
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ??
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    // API routes get a 401 JSON response
    if (pathname.startsWith('/api/')) {
      const body = JSON.stringify({ error: 'Unauthorized' });
      const response = new NextResponse(body, {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
      applySecurityHeaders(response);
      return response;
    }

    // Page routes redirect to login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    applySecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);

  // Request logging (edge-safe)
  const duration = Date.now() - start;
  console.log(
    `[Middleware] ${request.method} ${pathname} — ${duration}ms`
  );

  return response;
}

function applySecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

// ─── Matcher ────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
