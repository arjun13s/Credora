import { createHash } from "node:crypto";

import { NoopAttestationEmitter } from "@/lib/attestations";
import { getDemoPublishedSnapshots } from "@/lib/demo-published-snapshots";
import { buildHudRecommendationPayload } from "@/lib/hud-contract";
import {
  buildHudEvaluationRequest,
  chooseEvaluationMode,
  normalizeApplicationEvidence,
  runHudEvaluation,
  validateApplicationForEvaluation,
} from "@/lib/hud-routing";
import { readDatabase, writeDatabase } from "@/lib/persistence";
import { buildDeterministicEvaluation } from "@/lib/rubric";
import type {
  ApplicationDraft,
  Applicant,
  ApplicantProfile,
  ApplicantProfileInput,
  ApplicantProfileView,
  AuditLog,
  ConsentRecord,
  DisputeCase,
  GradingResult,
  PersistedDatabase,
  PublishedProfileSnapshot,
  PublishedSnapshotView,
  ProfileSubmission,
} from "@/lib/types";
import type {
  DraftSnapshot,
  ProfileStatusPayload,
  ProfileSummary,
  RecursivePartial,
  EvaluationResultPayload,
} from "@/lib/api-contracts";
import { createEmptyApplicantProfileInput, calculateCompletionPercent } from "@/lib/profile-defaults";
import { mergeApplicantProfileInput } from "@/lib/profile-merge";

const attestationEmitter = new NoopAttestationEmitter();

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString();
}

function createAuditLog(profileId: string, actor: AuditLog["actor"], action: string, detail: string): AuditLog {
  return {
    id: crypto.randomUUID(),
    profileId,
    actor,
    action,
    detail,
    at: new Date().toISOString(),
  };
}

function applicantFromInput(applicantId: string, input: ApplicantProfileInput, createdAt: string): Applicant {
  return {
    id: applicantId,
    fullName: input.personalInformation.fullName,
    email: input.personalInformation.email,
    phone: input.personalInformation.phone,
    city: input.personalInformation.city,
    state: input.personalInformation.state,
    createdAt,
  };
}

function syncApplicantFromInput(applicant: Applicant, input: ApplicantProfileInput) {
  applicant.fullName = input.personalInformation.fullName;
  applicant.email = input.personalInformation.email;
  applicant.phone = input.personalInformation.phone;
  applicant.city = input.personalInformation.city;
  applicant.state = input.personalInformation.state;
}

function deriveProfileStatus(
  recommendation: GradingResult["finalResult"]["recommendationStatus"],
): ApplicantProfile["status"] {
  if (recommendation === "Recommended") {
    return "complete";
  }

  return "needs_review";
}

function buildDraftSnapshot(
  draft: ApplicationDraft,
): DraftSnapshot {
  return {
    draftId: draft.id,
    profileId: draft.profileId,
    applicantId: draft.applicantId,
    version: draft.version,
    completionPercent: draft.completionPercent,
    updatedAt: draft.updatedAt,
    input: draft.input,
  };
}

function buildProfileSummary(
  database: PersistedDatabase,
  profile: ApplicantProfile,
): ProfileSummary | undefined {
  const applicant = database.applicants.find((entry) => entry.id === profile.applicantId);
  if (!applicant) {
    return undefined;
  }

  const grading = profile.latestGradingResultId
    ? database.gradingResults.find((entry) => entry.id === profile.latestGradingResultId)
    : undefined;

  return {
    profileId: profile.id,
    applicantId: profile.applicantId,
    fullName: applicant.fullName,
    email: applicant.email,
    useCase: profile.useCase,
    status: profile.status,
    publicationStatus: profile.publicationStatus,
    updatedAt: profile.updatedAt,
    recommendationStatus: grading?.finalResult.recommendationStatus,
    confidence: grading?.finalResult.confidence,
    overallBand: grading?.finalResult.overallBand,
    latestPublishedSnapshotId: profile.latestPublishedSnapshotId,
    latestPublishedVersion: profile.latestPublishedSnapshotId
      ? database.publishedSnapshots.find((entry) => entry.id === profile.latestPublishedSnapshotId)?.versionNumber
      : undefined,
    currentEvaluationPublished:
      Boolean(profile.latestGradingResultId) &&
      profile.latestPublishedGradingResultId === profile.latestGradingResultId,
  };
}

function buildProfileStatusPayload(
  database: PersistedDatabase,
  profile: ApplicantProfile,
): ProfileStatusPayload {
  const grading = profile.latestGradingResultId
    ? database.gradingResults.find((entry) => entry.id === profile.latestGradingResultId)
    : undefined;
  const draft = profile.currentDraftId
    ? database.drafts.find((entry) => entry.id === profile.currentDraftId)
    : undefined;
  const submission = profile.currentSubmissionId
    ? database.submissions.find((entry) => entry.id === profile.currentSubmissionId)
    : undefined;

  return {
    profileId: profile.id,
    status: profile.status,
    draftUpdatedAt: draft?.updatedAt,
    submittedAt: submission?.submittedAt,
    latestEvaluationAt: grading?.createdAt,
    recommendationStatus: grading?.finalResult.recommendationStatus,
    latestPublishedSnapshotId: profile.latestPublishedSnapshotId,
    latestPublishedVersion: profile.latestPublishedSnapshotId
      ? database.publishedSnapshots.find((entry) => entry.id === profile.latestPublishedSnapshotId)?.versionNumber
      : undefined,
    currentEvaluationPublished:
      Boolean(profile.latestGradingResultId) &&
      profile.latestPublishedGradingResultId === profile.latestGradingResultId,
  };
}

function buildEvaluationResultPayload(
  database: PersistedDatabase,
  profile: ApplicantProfile,
): EvaluationResultPayload {
  const grading = profile.latestGradingResultId
    ? database.gradingResults.find((entry) => entry.id === profile.latestGradingResultId)
    : undefined;

  return {
    profileId: profile.id,
    status: profile.status,
    result: grading?.finalResult,
    grading: grading
      ? {
          id: grading.id,
          provider: grading.provider,
          mode: grading.mode,
          fallbackUsed: grading.fallbackUsed,
          warnings: grading.warnings,
          traceId: grading.traceId,
          createdAt: grading.createdAt,
          rubricVersion: grading.rubricVersion,
        }
      : undefined,
  };
}

function createConsentRecords(
  profileId: string,
  submissionId: string,
  input: ApplicantProfileInput,
): ConsentRecord[] {
  const now = new Date();
  const entries: Array<{ source: ConsentRecord["source"]; active: boolean; scope: string; retentionDays: number }> = [
    {
      source: "identity_check",
      active: input.consents.identity_check,
      scope: "Identity confidence for housing application review",
      retentionDays: 30,
    },
    {
      source: "bank_connection",
      active: input.consents.bank_connection,
      scope: "Derived balance and payment signals for housing review",
      retentionDays: 45,
    },
    {
      source: "income_docs",
      active: input.consents.income_docs,
      scope: "Income-supporting documentation for housing review",
      retentionDays: 45,
    },
    {
      source: "housing_docs",
      active: input.consents.housing_docs,
      scope: "Lease, rent, and housing history evidence for housing review",
      retentionDays: 60,
    },
  ];

  return entries.map((entry) => ({
    id: crypto.randomUUID(),
    profileId,
    submissionId,
    source: entry.source,
    grantedAt: now.toISOString(),
    expiresAt: addDays(now, entry.retentionDays),
    status: entry.active ? "active" : "revoked",
    scope: entry.scope,
  }));
}

function buildPublishedSnapshotView(
  database: PersistedDatabase,
  snapshot: PublishedProfileSnapshot,
): PublishedSnapshotView | undefined {
  const applicant = database.applicants.find((entry) => entry.id === snapshot.applicantId);
  if (!applicant) {
    return undefined;
  }

  const attestation = database.attestations.find(
    (entry) => entry.publishedSnapshotId === snapshot.id,
  );

  const nextSnapshot = database.publishedSnapshots.find(
    (entry) => entry.previousSnapshotId === snapshot.id,
  );

  return {
    id: snapshot.id,
    profileId: snapshot.profileId,
    applicantId: snapshot.applicantId,
    applicantName: snapshot.publicDisplayName || applicant.fullName,
    versionNumber: snapshot.versionNumber,
    gradingResultId: snapshot.gradingResultId,
    previousSnapshotId: snapshot.previousSnapshotId,
    previousSnapshotHash: snapshot.previousSnapshotHash,
    nextSnapshotId: nextSnapshot?.id,
    isLatestVersion: !nextSnapshot,
    payloadHash: snapshot.payloadHash,
    publishedAt: snapshot.publishedAt,
    useCase: snapshot.publicPayload.useCase,
    overallScore: snapshot.publicPayload.overallScore,
    overallBand: snapshot.publicPayload.overallBand,
    confidence: snapshot.publicPayload.confidence,
    recommendationStatus: snapshot.publicPayload.recommendationStatus,
    summary: snapshot.publicPayload.summary,
    strengths: snapshot.publicPayload.strengths,
    riskFlags: snapshot.publicPayload.riskFlags,
    issues: snapshot.publicPayload.issues,
    categoryAssessments: snapshot.publicPayload.categoryAssessments,
    rubricVersion: snapshot.publicPayload.rubricVersion,
    attestation: attestation
      ? {
          id: attestation.id,
          attestationStatus: attestation.attestationStatus,
          payloadHash: attestation.payloadHash,
          signature: attestation.signature,
          chainAnchor: attestation.chainAnchor,
          createdAt: attestation.createdAt,
        }
      : undefined,
  };
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

function buildPublishedPayloadHash(input: {
  canonicalSchemaVersion: string;
  profileId: string;
  applicantId: string;
  submissionId: string;
  gradingResultId: string;
  versionNumber: number;
  previousSnapshotId?: string;
  previousSnapshotHash?: string;
  publicPayload: PublishedProfileSnapshot["publicPayload"];
}) {
  return createHash("sha256")
    .update(canonicalizeJson(input))
    .digest("hex");
}

function buildApplicantProfileView(
  database: PersistedDatabase,
  profile: ApplicantProfile,
): ApplicantProfileView | undefined {
  const applicant = database.applicants.find((entry) => entry.id === profile.applicantId);
  const submission = profile.currentSubmissionId
    ? database.submissions.find((entry) => entry.id === profile.currentSubmissionId)
    : undefined;

  if (!applicant || !submission) {
    return undefined;
  }

  const evidence = database.evidenceItems.filter((entry) => entry.submissionId === submission.id);
  const consents = database.consentRecords.filter((entry) => entry.profileId === profile.id);
  const gradingResult = profile.latestGradingResultId
    ? database.gradingResults.find((entry) => entry.id === profile.latestGradingResultId)
    : undefined;
  const latestPublishedSnapshot = database.publishedSnapshots
    .filter((entry) => entry.profileId === profile.id)
    .sort((left, right) => right.versionNumber - left.versionNumber)[0];
  const publishedSnapshots = database.publishedSnapshots
    .filter((entry) => entry.profileId === profile.id)
    .sort((left, right) => right.versionNumber - left.versionNumber)
    .map((entry) => buildPublishedSnapshotView(database, entry))
    .filter((entry): entry is PublishedSnapshotView => Boolean(entry));

  return {
    applicant,
    profile,
    submission,
    evidence,
    consents,
    gradingResult,
    latestPublishedSnapshot: publishedSnapshots[0],
    publishedSnapshots,
    canPublishSnapshot: Boolean(
      gradingResult &&
      (!latestPublishedSnapshot ||
        latestPublishedSnapshot.gradingResultId !== gradingResult.id),
    ),
    disputes: database.disputes.filter((entry) => entry.profileId === profile.id),
    auditLogs: database.auditLogs
      .filter((entry) => entry.profileId === profile.id)
      .sort((left, right) => right.at.localeCompare(left.at)),
  };
}

function buildPublicCategoryRationale(title: string) {
  return `${title} is shown publicly as a score band and score only. Detailed evidence stays in the private profile.`;
}

async function createApplicantProfileInternal(
  database: PersistedDatabase,
  rawInput: ApplicantProfileInput,
  source: "user",
) {
  const now = new Date().toISOString();
  const applicantId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const submissionId = crypto.randomUUID();
  const preparedEvidence = normalizeApplicationEvidence({
    profileId,
    submissionId,
    input: rawInput,
  });
  const normalizedInput = preparedEvidence.normalizedInput;

  const applicant = applicantFromInput(applicantId, normalizedInput, now);

  const profile: ApplicantProfile = {
    id: profileId,
    applicantId,
    useCase: normalizedInput.useCase,
    status: "grading",
    currentDraftId: draftId,
    currentSubmissionId: submissionId,
    publicationStatus: "private",
    createdAt: now,
    updatedAt: now,
  };

  const draft: ApplicationDraft = {
    id: draftId,
    profileId,
    applicantId,
    input: normalizedInput,
    completionPercent: calculateCompletionPercent(normalizedInput),
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const submission: ProfileSubmission = {
    id: submissionId,
    profileId,
    hudCaseId: profile.hudCaseId,
    submittedAt: now,
    rawFormSnapshot: normalizedInput,
    version: 1,
  };

  const evidence = preparedEvidence.evidenceItems;
  const consents = createConsentRecords(profileId, submissionId, normalizedInput);
  const normalizedEvidence = preparedEvidence.normalizedEvidence;

  database.applicants.push(applicant);
  database.profiles.push(profile);
  database.drafts.push(draft);
  database.submissions.push(submission);
  database.evidenceItems.push(...evidence);
  database.consentRecords.push(...consents);

  database.auditLogs.push(
    createAuditLog(profileId, "system", "profile_created", `Applicant profile was created via ${source}.`),
    createAuditLog(profileId, "system", "submission_saved", "Application submission snapshot was persisted."),
    createAuditLog(profileId, "system", "evaluation_started", "Evaluation pipeline was started for the latest submission."),
  );
  await writeDatabase(database);

  const deterministicEvaluation = buildDeterministicEvaluation(normalizedEvidence);
  const route = chooseEvaluationMode({
    input: normalizedInput,
    normalizedEvidence,
  });
  const evaluatorRequest = buildHudEvaluationRequest({
    caseId: submission.hudCaseId,
    profileId,
    submissionId,
    input: normalizedInput,
    normalizedEvidence,
    deterministicFeatures: deterministicEvaluation.features,
  });
  const graded = await runHudEvaluation({
    route,
    evaluatorRequest,
    fallback: deterministicEvaluation.finalResult,
  });

  const gradingResult: GradingResult = {
    id: crypto.randomUUID(),
    profileId,
    submissionId,
    rubricVersion: evaluatorRequest.rubricVersion,
    evaluationStatus: graded.fallbackUsed ? "fallback_completed" : "completed",
    externalRequestId: evaluatorRequest.caseId,
    provider: graded.provider,
    mode: graded.mode,
    deterministicFeatures: deterministicEvaluation.features,
    evaluatorRequest,
    evaluatorResponse: graded.evaluatorResponse,
    hudRecommendationPreview: evaluatorRequest.caseId
      ? buildHudRecommendationPayload({
          caseId: evaluatorRequest.caseId,
          submissionId,
          result: graded.finalResult,
          features: deterministicEvaluation.features,
          normalizedEvidence,
        })
      : undefined,
    finalResult: graded.finalResult,
    fallbackUsed: graded.fallbackUsed,
    warnings: graded.warnings,
    traceId: graded.traceId,
    createdAt: new Date().toISOString(),
  };

  profile.latestGradingResultId = gradingResult.id;
  profile.status = deriveProfileStatus(graded.finalResult.recommendationStatus);
  profile.updatedAt = new Date().toISOString();
  database.gradingResults.push(gradingResult);
  database.auditLogs.push(
    createAuditLog(
      profileId,
      "system",
      "evaluation_completed",
      graded.fallbackUsed
        ? "Deterministic evaluation was stored because the external evaluator was unavailable."
        : `Profile evaluation was stored using ${graded.provider} in ${graded.mode} mode.`,
    ),
  );

  graded.warnings.forEach((warning) => {
    database.auditLogs.push(createAuditLog(profileId, "system", "evaluation_warning", warning));
  });

  await attestationEmitter.emitSignedProfileExport(
    buildApplicantProfileView(database, profile)!,
  );

  return {
    database,
    view: buildApplicantProfileView(database, profile)!,
  };
}

export async function listProfiles() {
  const database = await readDatabase();
  return database.profiles
    .map((profile) => buildApplicantProfileView(database, profile))
    .filter((view): view is ApplicantProfileView => Boolean(view));
}

export async function listProfileSummaries() {
  const database = await readDatabase();
  return database.profiles
    .map((profile) => buildProfileSummary(database, profile))
    .filter((summary): summary is ProfileSummary => Boolean(summary));
}

export async function createProfileDraft(initialPatch?: RecursivePartial<ApplicantProfileInput>) {
  const now = new Date().toISOString();
  const applicantId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const input = mergeApplicantProfileInput(
    createEmptyApplicantProfileInput(),
    initialPatch ?? {},
  );

  const applicant = applicantFromInput(applicantId, input, now);
  const profile: ApplicantProfile = {
    id: profileId,
    applicantId,
    useCase: input.useCase,
    status: "draft",
    currentDraftId: draftId,
    publicationStatus: "private",
    createdAt: now,
    updatedAt: now,
  };
  const draft: ApplicationDraft = {
    id: draftId,
    profileId,
    applicantId,
    input,
    completionPercent: calculateCompletionPercent(input),
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const database = await readDatabase();
  database.applicants.push(applicant);
  database.profiles.push(profile);
  database.drafts.push(draft);
  database.auditLogs.push(
    createAuditLog(profileId, "system", "draft_created", "Application draft was created."),
  );
  await writeDatabase(database);

  return {
    summary: buildProfileSummary(database, profile)!,
    draft: buildDraftSnapshot(draft),
  };
}

export async function getProfileDraft(profileId: string) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);
  if (!profile || !profile.currentDraftId) {
    return undefined;
  }

  const draft = database.drafts.find((entry) => entry.id === profile.currentDraftId);
  if (!draft) {
    return undefined;
  }

  return buildDraftSnapshot(draft);
}

export async function updateProfileDraft(
  profileId: string,
  patch: RecursivePartial<ApplicantProfileInput>,
) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);
  if (!profile || !profile.currentDraftId) {
    return undefined;
  }

  const draft = database.drafts.find((entry) => entry.id === profile.currentDraftId);
  const applicant = database.applicants.find((entry) => entry.id === profile.applicantId);
  if (!draft || !applicant) {
    return undefined;
  }

  draft.input = mergeApplicantProfileInput(draft.input, patch);
  draft.updatedAt = new Date().toISOString();
  draft.version += 1;
  draft.completionPercent = calculateCompletionPercent(draft.input);
  profile.updatedAt = draft.updatedAt;
  profile.useCase = draft.input.useCase;
  syncApplicantFromInput(applicant, draft.input);
  database.auditLogs.push(
    createAuditLog(profileId, "applicant", "draft_updated", "Application draft fields were updated."),
  );
  await writeDatabase(database);

  return {
    summary: buildProfileSummary(database, profile)!,
    draft: buildDraftSnapshot(draft),
  };
}

export async function submitProfileDraft(
  profileId: string,
  patch?: RecursivePartial<ApplicantProfileInput>,
) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);
  if (!profile || !profile.currentDraftId) {
    return { ok: false as const, code: "draft_not_found" as const };
  }

  const draft = database.drafts.find((entry) => entry.id === profile.currentDraftId);
  const applicant = database.applicants.find((entry) => entry.id === profile.applicantId);
  if (!draft || !applicant) {
    return { ok: false as const, code: "draft_not_found" as const };
  }

  if (patch) {
    draft.input = mergeApplicantProfileInput(draft.input, patch);
    draft.version += 1;
  }

  const validationIssues = validateApplicationForEvaluation(draft.input);
  if (validationIssues.length > 0) {
    return {
      ok: false as const,
      code: "validation_failed" as const,
      issues: validationIssues,
      draft: buildDraftSnapshot(draft),
    };
  }

  const now = new Date().toISOString();
  const submissionId = crypto.randomUUID();
  const preparedEvidence = normalizeApplicationEvidence({
    profileId,
    submissionId,
    input: draft.input,
  });
  const normalizedInput = preparedEvidence.normalizedInput;
  syncApplicantFromInput(applicant, normalizedInput);
  draft.input = normalizedInput;
  draft.updatedAt = now;
  draft.completionPercent = calculateCompletionPercent(normalizedInput);

  const submission: ProfileSubmission = {
    id: submissionId,
    profileId,
    hudCaseId: profile.hudCaseId,
    submittedAt: now,
    rawFormSnapshot: normalizedInput,
    version: database.submissions.filter((entry) => entry.profileId === profileId).length + 1,
  };
  const evidence = preparedEvidence.evidenceItems;
  const consents = createConsentRecords(profileId, submissionId, normalizedInput);
  const normalizedEvidence = preparedEvidence.normalizedEvidence;

  profile.status = "grading";
  profile.currentSubmissionId = submissionId;
  profile.updatedAt = now;
  profile.useCase = normalizedInput.useCase;

  database.submissions.push(submission);
  database.evidenceItems = database.evidenceItems.filter((entry) => entry.submissionId !== submissionId);
  database.evidenceItems.push(...evidence);
  database.consentRecords.push(...consents);
  database.auditLogs.push(
    createAuditLog(profileId, "system", "submission_saved", "Draft was submitted and snapshot persisted."),
    createAuditLog(profileId, "system", "evaluation_started", "Evaluation pipeline was started for the submitted draft."),
  );
  await writeDatabase(database);

  const deterministicEvaluation = buildDeterministicEvaluation(normalizedEvidence);
  const route = chooseEvaluationMode({
    input: normalizedInput,
    normalizedEvidence,
  });
  const evaluatorRequest = buildHudEvaluationRequest({
    caseId: submission.hudCaseId,
    profileId,
    submissionId,
    input: normalizedInput,
    normalizedEvidence,
    deterministicFeatures: deterministicEvaluation.features,
  });
  const graded = await runHudEvaluation({
    route,
    evaluatorRequest,
    fallback: deterministicEvaluation.finalResult,
  });
  const gradingResult: GradingResult = {
    id: crypto.randomUUID(),
    profileId,
    submissionId,
    rubricVersion: evaluatorRequest.rubricVersion,
    evaluationStatus: graded.fallbackUsed ? "fallback_completed" : "completed",
    externalRequestId: evaluatorRequest.caseId,
    provider: graded.provider,
    mode: graded.mode,
    deterministicFeatures: deterministicEvaluation.features,
    evaluatorRequest,
    evaluatorResponse: graded.evaluatorResponse,
    hudRecommendationPreview: evaluatorRequest.caseId
      ? buildHudRecommendationPayload({
          caseId: evaluatorRequest.caseId,
          submissionId,
          result: graded.finalResult,
          features: deterministicEvaluation.features,
          normalizedEvidence,
        })
      : undefined,
    finalResult: graded.finalResult,
    fallbackUsed: graded.fallbackUsed,
    warnings: graded.warnings,
    traceId: graded.traceId,
    createdAt: new Date().toISOString(),
  };
  profile.latestGradingResultId = gradingResult.id;
  profile.status = deriveProfileStatus(graded.finalResult.recommendationStatus);
  profile.latestPublishedGradingResultId = undefined;
  profile.updatedAt = new Date().toISOString();
  database.gradingResults.push(gradingResult);

  database.auditLogs.push(
    createAuditLog(
      profileId,
      "system",
      "evaluation_completed",
      graded.fallbackUsed
        ? "Deterministic evaluation was stored because the external evaluator was unavailable."
        : `Profile evaluation was stored using ${graded.provider} in ${graded.mode} mode.`,
    ),
  );
  graded.warnings.forEach((warning) => {
    database.auditLogs.push(createAuditLog(profileId, "system", "evaluation_warning", warning));
  });
  await writeDatabase(database);

  const view = buildApplicantProfileView(database, profile);
  if (view) {
    await attestationEmitter.emitSignedProfileExport(view);
  }

  return {
    ok: true as const,
    view: view!,
    summary: buildProfileSummary(database, profile)!,
    status: buildProfileStatusPayload(database, profile),
    evaluation: buildEvaluationResultPayload(database, profile),
  };
}

export async function getApplicantProfileView(profileId: string) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);

  if (!profile) {
    return undefined;
  }

  return buildApplicantProfileView(database, profile);
}

export async function getProfileStatus(profileId: string) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);
  if (!profile) {
    return undefined;
  }

  return buildProfileStatusPayload(database, profile);
}

export async function getProfileEvaluation(profileId: string) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);
  if (!profile) {
    return undefined;
  }

  return buildEvaluationResultPayload(database, profile);
}

export async function getLatestPublishedSnapshotForProfile(profileId: string) {
  const database = await readDatabase();
  const snapshot = database.publishedSnapshots
    .filter((entry) => entry.profileId === profileId)
    .sort((left, right) => right.versionNumber - left.versionNumber)[0];

  return snapshot ? buildPublishedSnapshotView(database, snapshot) : undefined;
}

export async function getPublishedSnapshotView(snapshotId: string) {
  const database = await readDatabase();
  const snapshot = database.publishedSnapshots.find((entry) => entry.id === snapshotId);

  return snapshot
    ? buildPublishedSnapshotView(database, snapshot)
    : getDemoPublishedSnapshots().find((entry) => entry.id === snapshotId);
}

export async function listPublishedSnapshots() {
  const database = await readDatabase();
  const persisted = database.publishedSnapshots
    .slice()
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .map((entry) => buildPublishedSnapshotView(database, entry))
    .filter((entry): entry is PublishedSnapshotView => Boolean(entry));

  return [...persisted, ...getDemoPublishedSnapshots()].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

export async function createApplicantProfile(rawInput: ApplicantProfileInput) {
  const validationIssues = validateApplicationForEvaluation(rawInput);

  if (validationIssues.length > 0) {
    return {
      ok: false as const,
      issues: validationIssues,
    };
  }

  const database = await readDatabase();
  const created = await createApplicantProfileInternal(database, rawInput, "user");
  await writeDatabase(created.database);

  return {
    ok: true as const,
    view: created.view,
  };
}

export async function publishApplicantProfile(profileId: string) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);

  if (!profile || !profile.currentSubmissionId || !profile.latestGradingResultId) {
    return undefined;
  }

  const applicant = database.applicants.find((entry) => entry.id === profile.applicantId);
  const gradingResult = database.gradingResults.find(
    (entry) => entry.id === profile.latestGradingResultId,
  );
  if (!applicant || !gradingResult) {
    return undefined;
  }

  const previousSnapshot = database.publishedSnapshots
    .filter((entry) => entry.profileId === profileId)
    .sort((left, right) => right.versionNumber - left.versionNumber)[0];

  if (profile.status === "grading" || profile.status === "draft") {
    return undefined;
  }

  if (previousSnapshot && previousSnapshot.gradingResultId === gradingResult.id) {
    return {
      view: buildApplicantProfileView(database, profile),
      publishedSnapshot: buildPublishedSnapshotView(database, previousSnapshot),
      created: false as const,
    };
  }

  const publicPayload: PublishedProfileSnapshot["publicPayload"] = {
    schemaVersion: "credora.public-snapshot.v1",
    applicantName: applicant.fullName,
    useCase: profile.useCase,
    overallScore: gradingResult.finalResult.overallScore,
    overallBand: gradingResult.finalResult.overallBand,
    confidence: gradingResult.finalResult.confidence,
    recommendationStatus: gradingResult.finalResult.recommendationStatus,
    summary: gradingResult.finalResult.summary,
    strengths: gradingResult.finalResult.strengths,
    riskFlags: gradingResult.finalResult.riskFlags,
    issues: gradingResult.finalResult.issues,
    categoryAssessments: gradingResult.finalResult.categoryAssessments.map((category) => ({
      ...category,
      rationale: buildPublicCategoryRationale(category.title),
      evidenceLabels: [],
      flags: [],
    })),
    rubricVersion: gradingResult.rubricVersion,
  };

  const snapshot: PublishedProfileSnapshot = {
    id: crypto.randomUUID(),
    profileId,
    applicantId: applicant.id,
    submissionId: profile.currentSubmissionId,
    gradingResultId: gradingResult.id,
    versionNumber: previousSnapshot ? previousSnapshot.versionNumber + 1 : 1,
    previousSnapshotId: previousSnapshot?.id,
    previousSnapshotHash: previousSnapshot?.payloadHash,
    publicDisplayName: applicant.fullName,
    payloadHash: buildPublishedPayloadHash({
      canonicalSchemaVersion: "credora.public-hash.v1",
      profileId,
      applicantId: applicant.id,
      submissionId: profile.currentSubmissionId,
      gradingResultId: gradingResult.id,
      versionNumber: previousSnapshot ? previousSnapshot.versionNumber + 1 : 1,
      previousSnapshotId: previousSnapshot?.id,
      previousSnapshotHash: previousSnapshot?.payloadHash,
      publicPayload,
    }),
    publishedAt: new Date().toISOString(),
    publishedByApplicantConfirmedAt: new Date().toISOString(),
    disclosureVersion: "credora.publish-warning.v1",
    publicPayload,
  };

  database.publishedSnapshots.push(snapshot);
  profile.publicationStatus = "published";
  profile.latestPublishedSnapshotId = snapshot.id;
  profile.latestPublishedGradingResultId = gradingResult.id;
  profile.updatedAt = new Date().toISOString();
  database.auditLogs.push(
    createAuditLog(
      profileId,
      "applicant",
      "profile_published",
      `Applicant published public snapshot version ${snapshot.versionNumber}.`,
    ),
  );

  const attestation = {
    id: crypto.randomUUID(),
    profileId,
    publishedSnapshotId: snapshot.id,
    type: "published_snapshot_attestation" as const,
    attestationStatus: "demo" as const,
    payloadHash: snapshot.payloadHash,
    signature: `credora-demo-${snapshot.payloadHash.slice(0, 18)}`,
    createdAt: snapshot.publishedAt,
  };
  database.attestations.push(attestation);
  await writeDatabase(database);

  const snapshotView = buildPublishedSnapshotView(database, snapshot);
  if (snapshotView) {
    await attestationEmitter.emitPublishedSnapshotAttestation(snapshotView);
  }

  return {
    view: buildApplicantProfileView(database, profile),
    publishedSnapshot: snapshotView,
    created: true as const,
  };
}

export async function addDispute(
  profileId: string,
  dispute: Pick<DisputeCase, "field" | "explanation">,
) {
  const database = await readDatabase();
  const profile = database.profiles.find((entry) => entry.id === profileId);

  if (!profile) {
    return undefined;
  }

  database.disputes.push({
    id: crypto.randomUUID(),
    profileId,
    submissionId: profile.currentSubmissionId,
    gradingResultId: profile.latestGradingResultId,
    publishedSnapshotId:
      profile.latestPublishedGradingResultId === profile.latestGradingResultId
        ? profile.latestPublishedSnapshotId
        : undefined,
    field: dispute.field,
    explanation: dispute.explanation,
    status: "open",
    createdAt: new Date().toISOString(),
  });
  database.auditLogs.push(
    createAuditLog(profileId, "applicant", "dispute_opened", `Applicant opened a dispute for ${dispute.field}.`),
  );
  await writeDatabase(database);

  return buildApplicantProfileView(database, profile);
}

export async function logProfileAccess(
  profileId: string,
  entry: Pick<AuditLog, "actor" | "action" | "detail">,
) {
  const database = await readDatabase();
  const profile = database.profiles.find((candidate) => candidate.id === profileId);

  if (!profile) {
    return undefined;
  }

  database.auditLogs.push(createAuditLog(profileId, entry.actor, entry.action, entry.detail));
  await writeDatabase(database);

  return buildApplicantProfileView(database, profile);
}

export function createSignedProfileDigest(view: ApplicantProfileView) {
  const digest = createHash("sha256")
    .update(JSON.stringify({
      applicantId: view.applicant.id,
      profileId: view.profile.id,
      gradingResultId: view.gradingResult?.id ?? "none",
      generatedAt: view.gradingResult?.createdAt ?? view.profile.updatedAt,
    }))
    .digest("hex");

  return {
    payloadHash: digest,
    signaturePreview: digest.slice(0, 18),
  };
}
