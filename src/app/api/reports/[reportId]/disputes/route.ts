import { addDispute } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const body = (await request.json()) as {
    field: string;
    explanation: string;
  };
  const report = addDispute(reportId, body);

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report, { status: 201 });
}
