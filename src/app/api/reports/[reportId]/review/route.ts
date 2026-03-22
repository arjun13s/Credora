import { recordReview } from "@/lib/db";
import { reviewSchema, parseBody } from "@/lib/schemas";
import { requireRole } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { session, error } = await requireRole("reviewer");
  if (error) return error;

  const { reportId } = await params;
  const raw = await request.json();
  const parsed = parseBody(reviewSchema, raw);
  if (!parsed.success) return parsed.error;

  const report = recordReview(reportId, {
    ...parsed.data,
    createdAt: new Date().toISOString(),
  });

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json(report);
}
