import { redirect } from "next/navigation";

import { getLatestPublishedSnapshotForProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LegacyReviewerPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const latestSnapshot = await getLatestPublishedSnapshotForProfile(profileId);

  if (latestSnapshot) {
    redirect(`/published/${latestSnapshot.id}`);
  }

  redirect("/review");
}
