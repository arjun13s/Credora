import { notFound } from "next/navigation";

import { ReportPageClient } from "@/components/report-page-client";
import { getReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = getReport(reportId);

  if (!report) {
    notFound();
  }

  return <ReportPageClient initialReport={report} />;
}
