import { NextResponse } from 'next/server';

// 1. Specify protected and public routes
const protectedRoutes = ['/'];
const publicRoutes = ['/sign-in', '/sign-up'];

export default async function middleware(req) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Read the iron-session cookie (presence implies a session exists)
  const isLoggedIn = req.cookies.get('HireReady')?.value;   

  // 5. Redirect to /sign-in if the user is not authenticated
  if (isProtectedRoute && !isLoggedIn) {
    const url = new URL('/sign-in', req.nextUrl);
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }

  // 6. Redirect to / if the user is authenticated and on an auth page
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};


