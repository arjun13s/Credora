import { ApplicantBuilder } from "@/components/applicant-builder";
import { listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function ApplicantPage() {
  const sampleReportId = listReports()[0]?.id ?? "";

  return <ApplicantBuilder sampleReportId={sampleReportId} />;
}
