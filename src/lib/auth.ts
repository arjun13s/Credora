/**
 * Auth helpers — swap this file when adding real authentication.
 *
 * Compatible with: NextAuth, Clerk, Supabase Auth, Auth.js, Lucia, custom JWT.
 *
 * Usage in server components / API routes:
 *   const session = await getSession(request);
 *   if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
 */

export interface Session {
  userId: string;
  email: string;
  role: "applicant" | "reviewer" | "admin";
}

/**
 * Returns the current session or null if unauthenticated.
 * Replace with your auth provider's session lookup.
 *
 * Examples:
 *   NextAuth:  return await getServerSession(authOptions);
 *   Clerk:     return auth().userId ? { userId: auth().userId, ... } : null;
 *   Supabase:  const { data } = await supabase.auth.getSession(); return data.session;
 */
export async function getSession(
  _request?: Request,
): Promise<Session | null> {
  // TODO: replace with real auth provider
  return null;
}
