import { notFound } from "next/navigation";

import { ReviewerPageClient } from "@/components/reviewer-page-client";
import { getReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = getReport(reportId);

  if (!report) {
    notFound();
  }

  return <ReviewerPageClient initialReport={report} />;
}
