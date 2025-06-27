// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  // Define paths that are always public (auth pages, API routes)
  const publicPaths = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/graphql', // GraphQL API route is public as proxy endpoint
    '/api/health',  // Health API route is public
  ];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 1. If there's NO auth token AND the path is NOT public, redirect to login
  if (!authToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If there IS an auth token AND the user is trying to access a public auth page (login/register), redirect to dashboard
  // This prevents logged-in users from seeing login/register pages
  if (authToken && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = new URL('/', request.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. If none of the above conditions met, proceed with the request
  return NextResponse.next();
}

// Define which paths the middleware should apply to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files like JS/CSS chunks)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any other static assets you want to explicitly exclude (e.g., /public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};