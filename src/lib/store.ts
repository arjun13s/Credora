import { prisma } from "@/lib/db";
import { buildProfileSummary } from "@/lib/scoring";
import { getDefaultApplicantInput } from "@/lib/demo-scenarios";
import type {
  AccessLog,
  ApplicantInput,
  ConsentGrant,
  DisputeCase,
  ProfileSummary,
  ReviewAction,
} from "@/lib/types";

function parse(data: string): ProfileSummary {
  return JSON.parse(data) as ProfileSummary;
}

async function save(report: ProfileSummary): Promise<ProfileSummary> {
  await prisma.report.upsert({
    where: { id: report.id },
    update: { data: JSON.stringify(report) },
    create: { id: report.id, data: JSON.stringify(report) },
  });
  return report;
}

function appendLog(report: ProfileSummary, entry: Omit<AccessLog, "id" | "at">) {
  report.accessLogs.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...entry,
  });
}

export async function listReports(): Promise<ProfileSummary[]> {
  const rows = await prisma.report.findMany({ orderBy: { createdAt: "desc" } });

  if (rows.length === 0) {
    const seeded = buildProfileSummary(getDefaultApplicantInput());
    await save(seeded);
    return [seeded];
  }

  return rows.map((r) => parse(r.data));
}

export async function getReport(reportId: string): Promise<ProfileSummary | undefined> {
  const row = await prisma.report.findUnique({ where: { id: reportId } });
  return row ? parse(row.data) : undefined;
}

export async function createReport(input: ApplicantInput): Promise<ProfileSummary> {
  const report = buildProfileSummary(input);
  return save(report);
}

export async function logReportAccess(
  reportId: string,
  entry: Omit<AccessLog, "id" | "at">,
): Promise<ProfileSummary | undefined> {
  const report = await getReport(reportId);
  if (!report) return undefined;
  appendLog(report, entry);
  return save(report);
}

export async function addDispute(
  reportId: string,
  dispute: Omit<DisputeCase, "id" | "createdAt" | "status">,
): Promise<ProfileSummary | undefined> {
  const report = await getReport(reportId);
  if (!report) return undefined;

  const newDispute: DisputeCase = {
    ...dispute,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "open",
  };

  report.disputes.unshift(newDispute);
  appendLog(report, {
    actor: "applicant",
    action: "dispute_opened",
    detail: `Dispute submitted for ${dispute.field}.`,
  });

  return save(report);
}

export async function recordReview(
  reportId: string,
  review: ReviewAction,
): Promise<ProfileSummary | undefined> {
  const report = await getReport(reportId);
  if (!report) return undefined;

  report.reviewerAction = review;
  appendLog(report, {
    actor: "reviewer",
    action: "review_note_added",
    detail: `${review.reviewerName} recorded "${review.disposition}".`,
  });

  return save(report);
}

export async function updateConsentStatus(
  reportId: string,
  source: ConsentGrant["source"],
  status: ConsentGrant["status"],
): Promise<ProfileSummary | undefined> {
  const report = await getReport(reportId);
  if (!report) return undefined;

  report.consent = report.consent.map((grant) =>
    grant.source === source ? { ...grant, status } : grant,
  );

  appendLog(report, {
    actor: "applicant",
    action: status === "revoked" ? "consent_revoked" : "consent_restored",
    detail: `Consent for ${source} changed to ${status}.`,
  });

  return save(report);
}
