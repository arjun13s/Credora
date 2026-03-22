import { notFound } from "next/navigation";

import { ReviewerProfileClient } from "@/components/reviewer-profile-client";
import { getApplicantProfileView, getReviewerProfileView } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReviewerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { profileId } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const reviewerView = await getReviewerProfileView(profileId, token);

  if (!reviewerView) {
    notFound();
  }

  const applicantView = await getApplicantProfileView(profileId);

  return (
    <ReviewerProfileClient
      initialReviewerView={reviewerView}
      initialApplicantView={applicantView}
    />
  );
}
