import { recordReview } from "@/lib/store";
import type { ReviewAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const body = (await request.json()) as Omit<ReviewAction, "createdAt">;
  const report = await recordReview(reportId, {
    ...body,
    createdAt: new Date().toISOString(),
  });

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report);
}
