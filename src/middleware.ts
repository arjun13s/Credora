/**
 * Edge middleware — auth, rate-limiting, and request guards go here.
 *
 * Currently a passthrough (no auth enforced — demo mode).
 *
 * To add auth:
 *   NextAuth:  export { default } from "next-auth/middleware";
 *   Clerk:     import { clerkMiddleware } from "@clerk/nextjs/server"; export default clerkMiddleware();
 *   Custom:    Check request headers/cookies, redirect to /login if no valid session.
 *
 * To protect specific routes, configure `matcher` below.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // TODO: add session check here when auth is wired
  return NextResponse.next();
}

export const config = {
  // Protect these routes once auth is live:
  // matcher: ["/profile/:path*", "/review/:path*", "/api/reports/:path*"],
  matcher: [],
};
