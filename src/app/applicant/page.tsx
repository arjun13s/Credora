import { ApplicantBuilder } from "@/components/applicant-builder";
import { listReports } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ApplicantPage() {
  return <ApplicantBuilder />;
}
