import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { toHudDecisionBand, toHudNumericConfidence } from "@/lib/hud-contract";
import type { PersistedDatabase } from "@/lib/types";

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "credora-db.json");

const emptyDatabase: PersistedDatabase = {
  schemaVersion: "credora.db.v5",
  applicants: [],
  profiles: [],
  drafts: [],
  submissions: [],
  evidenceItems: [],
  consentRecords: [],
  gradingResults: [],
  publishedSnapshots: [],
  disputes: [],
  auditLogs: [],
  attestations: [],
};

function migrateDatabase(raw: unknown): PersistedDatabase {
  const parsed = raw && typeof raw === "object" ? (raw as Partial<PersistedDatabase>) : {};
  const gradingResults: PersistedDatabase["gradingResults"] = Array.isArray(parsed.gradingResults)
    ? parsed.gradingResults.map((entry) => {
        const migrated = entry as PersistedDatabase["gradingResults"][number] & {
          llmOutput?: unknown;
          finalResult?: PersistedDatabase["gradingResults"][number]["finalResult"] & {
            reasoningSummary?: string;
          };
        };

        return {
          ...migrated,
          mode: migrated.mode ?? "local_mock",
          provider:
            migrated.provider === "hud_remote" ||
            migrated.provider === "external_mock" ||
            migrated.provider === "deterministic"
              ? migrated.provider
              : "external_mock",
          evaluatorRequest: migrated.evaluatorRequest,
          evaluatorResponse: migrated.evaluatorResponse ?? null,
          warnings: Array.isArray(migrated.warnings) ? migrated.warnings : [],
          finalResult: migrated.finalResult
            ? {
                ...migrated.finalResult,
                summary:
                  migrated.finalResult.summary ??
                  migrated.finalResult.reasoningSummary ??
                  "Credora stored an earlier evaluation record for this applicant profile.",
                hudDecisionBand:
                  migrated.finalResult.hudDecisionBand ??
                  toHudDecisionBand(migrated.finalResult.recommendationStatus),
                hudCategoryScores: migrated.finalResult.hudCategoryScores ?? {
                  identity: 0,
                  income: 0,
                  housing: 0,
                  payment: 0,
                  employment: 0,
                  completeness: 0,
                  consistency: 100,
                },
                numericConfidence:
                  migrated.finalResult.numericConfidence ??
                  toHudNumericConfidence(migrated.finalResult.confidence),
              }
            : {
                overallScore: null,
                overallBand: "Unknown" as const,
                confidence: "Low" as const,
                recommendationStatus: "Insufficient evidence" as const,
                strengths: [],
                riskFlags: [],
                issues: [],
                missingEvidence: [],
                evidenceUsed: [],
                summary: "Credora could not recover a complete evaluation record from storage.",
                manualReviewTriggers: [],
                confidenceNotes: [],
                categoryAssessments: [],
                hudDecisionBand: "needs_manual_review" as const,
                hudCategoryScores: {
                  identity: 0,
                  income: 0,
                  housing: 0,
                  payment: 0,
                  employment: 0,
                  completeness: 0,
                  consistency: 100,
                },
                numericConfidence: 45,
              },
          evaluationStatus:
            migrated.evaluationStatus === "completed" || migrated.evaluationStatus === "fallback_completed"
              ? migrated.evaluationStatus
              : "completed",
          externalRequestId: migrated.externalRequestId,
          hudRecommendationPreview: migrated.hudRecommendationPreview,
        };
      })
    : [];

  return {
    ...emptyDatabase,
    ...parsed,
    schemaVersion: emptyDatabase.schemaVersion,
    applicants: Array.isArray(parsed.applicants) ? parsed.applicants : [],
    profiles: Array.isArray(parsed.profiles)
      ? parsed.profiles.map((entry) => {
          const profile = entry as PersistedDatabase["profiles"][number] & {
            shareStatus?: "private" | "shareable" | "revoked" | "published";
            publicationStatus?: "private" | "published";
          };

          return {
            ...profile,
            publicationStatus:
              profile.publicationStatus ??
              (profile.shareStatus === "published" ? "published" : "private"),
            latestPublishedSnapshotId: profile.latestPublishedSnapshotId,
            latestPublishedGradingResultId: profile.latestPublishedGradingResultId,
          };
        })
      : [],
    drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
    submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
    evidenceItems: Array.isArray(parsed.evidenceItems) ? parsed.evidenceItems : [],
    consentRecords: Array.isArray(parsed.consentRecords) ? parsed.consentRecords : [],
    gradingResults,
    publishedSnapshots: Array.isArray(parsed.publishedSnapshots) ? parsed.publishedSnapshots : [],
    disputes: Array.isArray(parsed.disputes) ? parsed.disputes : [],
    auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    attestations: Array.isArray(parsed.attestations)
      ? parsed.attestations.map((entry) => {
          const attestation = entry as PersistedDatabase["attestations"][number] & {
            attestationStatus?: "demo" | "signed" | "anchored";
          };

          return {
            ...attestation,
            attestationStatus: attestation.attestationStatus ?? "demo",
          };
        })
      : [],
  };
}

export async function readDatabase(): Promise<PersistedDatabase> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return migrateDatabase(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      await mkdir(dataDir, { recursive: true });
      const backupFile = path.join(dataDir, `credora-db.corrupt-${Date.now()}.json`);

      try {
        await copyFile(dataFile, backupFile);
      } catch {
        // Preserve the current flow even if backup creation fails.
      }

      throw new Error(
        `Credora database could not be read safely. A backup was attempted at ${backupFile}.`,
      );
    }

    await mkdir(dataDir, { recursive: true });
    await writeDatabase(emptyDatabase);
    return structuredClone(emptyDatabase);
  }
}

export async function writeDatabase(database: PersistedDatabase) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(database, null, 2), "utf8");
}
