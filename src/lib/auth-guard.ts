import { auth0 } from "@/auth";

export type UserRole = "applicant" | "reviewer";

export async function requireAuth() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function requireRole(requiredRole: UserRole) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return {
      session: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roles: string[] =
    (session.user?.["https://credora.app/roles"] as string[]) ?? [];

  if (!roles.includes(requiredRole)) {
    return {
      session,
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
