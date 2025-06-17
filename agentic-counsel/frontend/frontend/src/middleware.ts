import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/coaching',
  '/progress',
  '/onboarding'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🛡️  MIDDLEWARE: Processing request:', {
    pathname,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  });
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.includes(pathname);
  
  console.log('🔍 MIDDLEWARE: Route analysis:', {
    pathname,
    isProtectedRoute,
    isPublicRoute
  });
  
  // Get the authentication token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  console.log('🍪 MIDDLEWARE: Token check:', {
    tokenFound: !!token,
    tokenLength: token?.length || 0,
    cookieCount: request.cookies.size
  });
  
  if (!token) {
    console.log('⚠️  MIDDLEWARE: No authentication token found in cookies');
  }
  
  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    console.log('🚫 MIDDLEWARE: Redirecting to login - protected route without token:', pathname);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing login/register with a valid token, redirect to dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    console.log('↩️  MIDDLEWARE: Redirecting to dashboard - already authenticated');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If accessing root with a valid token, redirect to dashboard
  if (pathname === '/' && token) {
    console.log('🏠 MIDDLEWARE: Redirecting root to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  console.log('✅ MIDDLEWARE: Allowing request to proceed:', pathname);
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};