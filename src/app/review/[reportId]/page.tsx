import { notFound } from "next/navigation";

import { ProfileClient } from "@/components/profile-client";
import { getReport } from "@/lib/db";

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

  return <ProfileClient initialReport={report} defaultTab="reviewer" />;
}
