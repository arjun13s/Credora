import { createReport } from "@/lib/store";
import { applicantInputSchema, parseBody } from "@/lib/schemas";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.json();
  const parsed = parseBody(applicantInputSchema, raw);
  if (!parsed.success) return parsed.error;

  const report = createReport(parsed.data);

  return Response.json(report, { status: 201 });
}
