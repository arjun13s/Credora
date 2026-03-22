import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

const PROTECTED_PREFIXES = ["/applicant", "/review", "/profile"];

const AUTH_SECRET = process.env.AUTH_SECRET || "super-secret-default-key-for-mvp";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const secureCookieName = "__Secure-authjs.session-token";
  const standardCookieName = "authjs.session-token";

  // Check for the NextAuth session token cookie
  const secureTokenValue = request.cookies.get(secureCookieName)?.value;
  const standardTokenValue = request.cookies.get(standardCookieName)?.value;

  const sessionToken = secureTokenValue || standardTokenValue;
  const isLoggedIn = !!sessionToken;

  // Redirect unauthenticated users to login
  if (isProtectedPath && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Role-based access control for protected paths
  if (isProtectedPath && isLoggedIn && sessionToken) {
    try {
      const salt = secureTokenValue ? secureCookieName : standardCookieName;
      const token = await decode({ token: sessionToken, secret: AUTH_SECRET, salt });
      const role = token?.role as string | undefined;

      // Applicants cannot access reviewer pages
      if (pathname.startsWith("/review") && role !== "reviewer") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Reviewers cannot access applicant pages
      if (pathname.startsWith("/applicant") && role !== "applicant") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // If token decode fails, allow the request through — server-side
      // auth will catch it. Avoids blocking on edge decode issues.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
