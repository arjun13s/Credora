import { logReportAccess } from "@/lib/store";
import { accessLogSchema, parseBody } from "@/lib/schemas";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;
  const raw = await request.json();
  const parsed = parseBody(accessLogSchema, raw);
  if (!parsed.success) return parsed.error;

  const report = logReportAccess(reportId, parsed.data);

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report);
}
