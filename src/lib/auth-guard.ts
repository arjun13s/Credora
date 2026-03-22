import { auth } from "@/auth";
import type { UserRole } from "@/lib/users";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function requireRole(requiredRole: UserRole) {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if ((session.user as any).role !== requiredRole) {
    return {
      session,
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
