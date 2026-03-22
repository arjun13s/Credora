import { ApplicantProfileForm } from "@/components/applicant-profile-form";
import { getSeededScenarioPreview } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ApplicantProfilePage() {
  const seeded = await getSeededScenarioPreview();

  return (
    <ApplicantProfileForm
      seededProfileId={seeded?.profileId}
      seededShareToken={seeded?.shareLink?.token}
    />
  );
}
