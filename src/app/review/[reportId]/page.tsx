import { redirect } from "next/navigation";

import { getLatestPublishedSnapshotForProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LegacyReviewRedirectPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const snapshot = await getLatestPublishedSnapshotForProfile(reportId);

  if (snapshot) {
    redirect(`/published/${snapshot.id}`);
  }

  redirect("/review");
}
