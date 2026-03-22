import { updateConsentStatus } from "@/lib/store";
import { consentUpdateSchema, parseBody } from "@/lib/schemas";
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
  const parsed = parseBody(consentUpdateSchema, raw);
  if (!parsed.success) return parsed.error;

  const report = updateConsentStatus(reportId, parsed.data.source, parsed.data.status);

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report);
}
