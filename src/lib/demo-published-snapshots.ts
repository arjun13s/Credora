import { createHash } from "node:crypto";

import { demoScenarios } from "@/lib/demo-scenarios";
import { buildNormalizedEvidenceBundle, normalizeApplicantInput } from "@/lib/grading";
import { buildDeterministicEvaluation } from "@/lib/rubric";
import type { PublishedSnapshotView } from "@/lib/types";

const PUBLISHED_AT_BY_INDEX = [
  "2026-03-22T16:20:00.000Z",
  "2026-03-22T15:05:00.000Z",
  "2026-03-22T13:40:00.000Z",
  "2026-03-22T12:15:00.000Z",
  "2026-03-22T10:50:00.000Z",
  "2026-03-22T09:25:00.000Z",
  "2026-03-22T08:10:00.000Z",
  "2026-03-21T19:35:00.000Z",
  "2026-03-21T18:10:00.000Z",
  "2026-03-21T16:45:00.000Z",
  "2026-03-21T15:20:00.000Z",
  "2026-03-21T13:55:00.000Z",
  "2026-03-21T12:30:00.000Z",
  "2026-03-21T11:05:00.000Z",
  "2026-03-21T09:40:00.000Z",
  "2026-03-21T08:15:00.000Z",
];

function getPublishedAtForIndex(index: number) {
  if (PUBLISHED_AT_BY_INDEX[index]) {
    return PUBLISHED_AT_BY_INDEX[index];
  }

  const base = new Date("2026-03-21T08:15:00.000Z");
  base.setUTCMinutes(base.getUTCMinutes() + (index - PUBLISHED_AT_BY_INDEX.length) * 45);
  if (base.getUTCDate() > 22) {
    return "2026-03-22T23:45:00.000Z";
  }
  return base.toISOString();
}

function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalizeJson(entry)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(record[key])}`)
    .join(",")}}`;
}

function buildPublicCategoryRationale(title: string) {
  return `${title} is shown publicly as a score band and score only. Detailed evidence stays off the public snapshot.`;
}

export function getDemoPublishedSnapshots(): PublishedSnapshotView[] {
  return demoScenarios.map((scenario, index) => {
    const profileId = `demo-profile-${scenario.key}`;
    const applicantId = `demo-applicant-${scenario.key}`;
    const submissionId = `demo-submission-${scenario.key}`;
    const gradingResultId = `demo-grading-${scenario.key}`;
    const snapshotId = `demo-snapshot-${scenario.key}`;
    const publishedAt = getPublishedAtForIndex(index);

    const normalizedInput = normalizeApplicantInput(structuredClone(scenario.input));
    const normalizedEvidence = buildNormalizedEvidenceBundle(
      profileId,
      submissionId,
      normalizedInput,
    );
    const deterministic = buildDeterministicEvaluation(normalizedEvidence);
    const result = deterministic.finalResult;

    const publicPayload = {
      schemaVersion: "credora.public-snapshot.v1",
      applicantName: normalizedInput.personalInformation.fullName,
      useCase: normalizedInput.useCase,
      overallScore: result.overallScore,
      overallBand: result.overallBand,
      confidence: result.confidence,
      recommendationStatus: result.recommendationStatus,
      summary: result.summary,
      strengths: result.strengths,
      riskFlags: result.riskFlags,
      issues: result.issues,
      categoryAssessments: result.categoryAssessments.map((category) => ({
        ...category,
        rationale: buildPublicCategoryRationale(category.title),
        evidenceLabels: [],
        flags: [],
      })),
      rubricVersion: "credora-rubric-v3",
    };

    const payloadHash = createHash("sha256")
      .update(
        canonicalizeJson({
          canonicalSchemaVersion: "credora.public-hash.v1",
          profileId,
          applicantId,
          submissionId,
          gradingResultId,
          versionNumber: 1,
          publicPayload,
        }),
      )
      .digest("hex");

    return {
      id: snapshotId,
      profileId,
      applicantId,
      applicantName: normalizedInput.personalInformation.fullName,
      versionNumber: 1,
      gradingResultId,
      isLatestVersion: true,
      payloadHash,
      publishedAt,
      useCase: normalizedInput.useCase,
      overallScore: result.overallScore,
      overallBand: result.overallBand,
      confidence: result.confidence,
      recommendationStatus: result.recommendationStatus,
      summary: result.summary,
      strengths: result.strengths,
      riskFlags: result.riskFlags,
      issues: result.issues,
      categoryAssessments: publicPayload.categoryAssessments,
      rubricVersion: publicPayload.rubricVersion,
      attestation: {
        id: `demo-attestation-${scenario.key}`,
        attestationStatus: "demo",
        payloadHash,
        signature: `credora-demo-${payloadHash.slice(0, 18)}`,
        createdAt: publishedAt,
      },
    };
  });
}
