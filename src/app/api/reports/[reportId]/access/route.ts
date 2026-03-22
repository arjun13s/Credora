import { logReportAccess } from "@/lib/db";
import type { AccessLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const body = (await request.json()) as Omit<AccessLog, "id" | "at">;
  const report = logReportAccess(reportId, body);

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report);
}
