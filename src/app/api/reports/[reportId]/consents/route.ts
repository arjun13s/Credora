import { updateConsentStatus } from "@/lib/store";
import type { ConsentGrant } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const body = (await request.json()) as {
    source: ConsentGrant["source"];
    status: ConsentGrant["status"];
  };
  const report = await updateConsentStatus(reportId, body.source, body.status);

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report);
}
