import { getReport } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;
  const report = getReport(reportId);

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report);
}
