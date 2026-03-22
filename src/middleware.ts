import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth0 } from "@/auth";

const PROTECTED_PREFIXES = ["/applicant", "/review", "/profile"];

export async function middleware(request: NextRequest) {
  const authResponse = await auth0.middleware(request);

  const { pathname } = request.nextUrl;

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedPath) {
    const session = await auth0.getSession(request);

    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const roles: string[] =
      (session.user?.["https://credora.app/roles"] as string[]) ?? [];

    // Applicants cannot access reviewer pages
    if (pathname.startsWith("/review") && !roles.includes("reviewer")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Reviewers cannot access applicant pages
    if (pathname.startsWith("/applicant") && !roles.includes("applicant")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login") {
    const session = await auth0.getSession(request);
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
