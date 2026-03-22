/**
 * In-memory persistence — dev/demo only.
 *
 * To connect a real backend, replace this file's implementation
 * (or swap the export in index.ts) with Prisma, Drizzle, Supabase,
 * Firebase, or any other adapter that satisfies the same function
 * signatures exported from index.ts.
 */

import { buildProfileSummary } from "@/lib/scoring";
import { getDefaultApplicantInput } from "@/lib/db/seed";
import type {
  AccessLog,
  ApplicantInput,
  ConsentGrant,
  DisputeCase,
  ProfileSummary,
  ReviewAction,
} from "@/lib/types";

declare global {
  var __credoraStore__: Map<string, ProfileSummary> | undefined;
}

function getBackingStore() {
  if (!globalThis.__credoraStore__) {
    globalThis.__credoraStore__ = new Map<string, ProfileSummary>();

    const seeded = buildProfileSummary(getDefaultApplicantInput());
    globalThis.__credoraStore__.set(seeded.id, seeded);
  }

  return globalThis.__credoraStore__;
}

function appendLog(report: ProfileSummary, entry: Omit<AccessLog, "id" | "at">) {
  report.accessLogs.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...entry,
  });
}

export function listReports() {
  return Array.from(getBackingStore().values());
}

export function getReport(reportId: string) {
  return getBackingStore().get(reportId);
}

export function createReport(input: ApplicantInput) {
  const report = buildProfileSummary(input);
  getBackingStore().set(report.id, report);
  return report;
}

export function logReportAccess(
  reportId: string,
  entry: Omit<AccessLog, "id" | "at">,
) {
  const report = getReport(reportId);

  if (!report) {
    return undefined;
  }

  appendLog(report, entry);
  return report;
}

export function addDispute(
  reportId: string,
  dispute: Omit<DisputeCase, "id" | "createdAt" | "status">,
) {
  const report = getReport(reportId);

  if (!report) {
    return undefined;
  }

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

  return report;
}

export function recordReview(reportId: string, review: ReviewAction) {
  const report = getReport(reportId);

  if (!report) {
    return undefined;
  }

  report.reviewerAction = review;
  appendLog(report, {
    actor: "reviewer",
    action: "review_note_added",
    detail: `${review.reviewerName} recorded "${review.disposition}".`,
  });

  return report;
}

export function updateConsentStatus(
  reportId: string,
  source: ConsentGrant["source"],
  status: ConsentGrant["status"],
) {
  const report = getReport(reportId);

  if (!report) {
    return undefined;
  }

  report.consent = report.consent.map((grant) =>
    grant.source === source ? { ...grant, status } : grant,
  );

  appendLog(report, {
    actor: "applicant",
    action: status === "revoked" ? "consent_revoked" : "consent_restored",
    detail: `Consent for ${source} changed to ${status}.`,
  });

  return report;
}
