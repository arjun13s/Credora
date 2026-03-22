import { addDispute } from "@/lib/store";
import { disputeSchema, parseBody } from "@/lib/schemas";
import { requireRole } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { session, error } = await requireRole("applicant");
  if (error) return error;

  const { reportId } = await params;
  const raw = await request.json();
  const parsed = parseBody(disputeSchema, raw);
  if (!parsed.success) return parsed.error;

  const report = addDispute(reportId, parsed.data);

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report, { status: 201 });
}
