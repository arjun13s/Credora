import { notFound } from "next/navigation";

import { ProfileResultsClient } from "@/components/profile-results-client";
import { getApplicantProfileView } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ApplicantResultsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const view = await getApplicantProfileView(profileId);

  if (!view) {
    notFound();
  }

  return <ProfileResultsClient initialView={view} />;
}
