import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req: NextRequest) {
  // 1. Retrieve the NextAuth JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const userType = (token as any)?.userType; // 'staff' or 'client'

  // 🚀 RULE 1: IF ALREADY LOGGED IN -> Block access to Login & Register Pages!
  if (token && (pathname === '/client/login' || pathname === '/pos/login' || pathname === '/client/register')) {
    if (userType === 'staff') {
      return NextResponse.redirect(new URL('/pos', req.url));
    } else {
      return NextResponse.redirect(new URL('/client/profile', req.url));
    }
  }

  // 🚀 RULE 2: PROTECT /pos (Only Staff Allowed)
  if (pathname.startsWith('/pos') && pathname !== '/pos/login') {
    // If guest -> Redirect to POS Login
    if (!token) {
      return NextResponse.redirect(new URL('/pos/login', req.url));
    }
    // If logged in as Client -> Redirect to Client Profile
    if (userType !== 'staff') {
      return NextResponse.redirect(new URL('/client/profile', req.url));
    }
  }

  // 🚀 RULE 3: PROTECT /client/profile (Only Clients Allowed)
  if (pathname.startsWith('/client/profile')) {
    // If guest -> Redirect to Customer Login
    if (!token) {
      const loginUrl = new URL('/client/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
    // If logged in as Staff -> Redirect to POS
    if (userType === 'staff') {
      return NextResponse.redirect(new URL('/pos', req.url));
    }
  }

  // 🚀 RULE 4: PROTECT /order (BLOCK STAFF FROM ONLINE CUSTOMER ORDER PAGE)
  if (pathname.startsWith('/order')) {
    if (token && userType === 'staff') {
      return NextResponse.redirect(new URL('/pos', req.url));
    }
  }

  return NextResponse.next();
}

// Specify which routes are intercepted by middleware
export const config = {
  matcher: [
    '/client/login',
    '/client/register',
    '/pos/login',
    '/pos/:path*',
    '/client/profile/:path*',
    '/order/:path*'
  ],
};