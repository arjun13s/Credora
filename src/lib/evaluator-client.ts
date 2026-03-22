import { validateExternalEvaluatorResponse } from "@/lib/evaluator-validator";
import type {
  ApplicantProfileInput,
  DeterministicFeatureSet,
  EvaluationMode,
  ExternalEvaluatorRequest,
  ExternalEvaluatorResponse,
  FinalGradingResult,
  GradingProvider,
  NormalizedEvidenceBundle,
} from "@/lib/types";

function currentMode(): EvaluationMode {
  const configured = process.env.CREDORA_EVALUATOR_MODE;

  if (
    configured === "deterministic_only" ||
    configured === "local_mock" ||
    configured === "hud_remote"
  ) {
    return configured;
  }

  return "local_mock";
}

export function buildExternalEvaluatorRequest(args: {
  profileId: string;
  submissionId: string;
  input: ApplicantProfileInput;
  normalizedEvidence: NormalizedEvidenceBundle;
  deterministicFeatures: DeterministicFeatureSet;
}): ExternalEvaluatorRequest {
  return {
    requestId: crypto.randomUUID(),
    profileId: args.profileId,
    submissionId: args.submissionId,
    useCase: args.input.useCase,
    rubricVersion: "credora-rubric-v3",
    schemaVersion: args.normalizedEvidence.schemaVersion,
    createdAt: new Date().toISOString(),
    applicantContext: args.normalizedEvidence.applicantContext,
    normalizedEvidence: args.normalizedEvidence,
    deterministicFeatures: args.deterministicFeatures,
    policy: {
      purposeLimitedUse: "tenant_screening",
      missingDataMeansUncertainty: true,
      noProtectedTraitInference: true,
      manualReviewRequiredForInconsistency: true,
    },
  };
}

function buildLocalMockResponse(
  request: ExternalEvaluatorRequest,
  fallback: FinalGradingResult,
): ExternalEvaluatorResponse {
  return {
    requestId: request.requestId,
    mode: "local_mock",
    provider: "external_mock",
    status: "completed",
    overallScore: fallback.overallScore,
    overallBand: fallback.overallBand,
    confidence: fallback.confidence,
    recommendationStatus: fallback.recommendationStatus,
    categoryScores: Object.fromEntries(
      fallback.categoryAssessments.map((category) => [category.key, category.score]),
    ),
    categoryBands: Object.fromEntries(
      fallback.categoryAssessments.map((category) => [category.key, category.band]),
    ),
    strengths: fallback.strengths,
    riskFlags: fallback.riskFlags,
    issues: fallback.issues,
    missingEvidence: fallback.missingEvidence,
    evidenceUsed: fallback.evidenceUsed,
    summary:
      fallback.recommendationStatus === "Recommended"
        ? "Credora found a strong mix of verified housing, income, identity, and payment signals for this rental profile."
        : fallback.recommendationStatus === "Insufficient evidence"
          ? "Credora organized the profile successfully, but more verified evidence is needed before the result can be used confidently."
          : fallback.recommendationStatus === "Potential inconsistency detected"
            ? "Credora found a mismatch in the submitted information and routed the profile to manual review."
            : "Credora found useful housing-specific signals, but this profile still benefits from manual review before a housing decision is made.",
    manualReviewTriggers: fallback.manualReviewTriggers,
    confidenceNotes: [
      ...fallback.confidenceNotes.slice(0, 1),
      "Adding more verified evidence can increase confidence in this applicant profile.",
    ].slice(0, 5),
    warnings: [
      "External evaluator not connected. Deterministic rubric stored a stable result for this profile.",
    ],
    traceId: `mock-${request.requestId.slice(0, 12)}`,
    evaluatedAt: new Date().toISOString(),
  };
}

async function callHudEvaluator(
  request: ExternalEvaluatorRequest,
): Promise<unknown> {
  const evaluatorUrl = process.env.CREDORA_HUD_EVALUATOR_URL;
  const timeoutMs = Number(process.env.CREDORA_HUD_EVALUATOR_TIMEOUT_MS ?? 2500);

  if (!evaluatorUrl) {
    throw new Error("HUD evaluator URL is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetch(evaluatorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(request),
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`HUD evaluator request failed with ${response.status}.`);
  }

  return response.json();
}

export async function evaluatePreparedProfile(
  request: ExternalEvaluatorRequest,
  fallback: FinalGradingResult,
): Promise<{
  provider: GradingProvider;
  mode: EvaluationMode;
  fallbackUsed: boolean;
  evaluatorResponse: ExternalEvaluatorResponse | null;
  finalResult: FinalGradingResult;
  warnings: string[];
  traceId?: string;
}> {
  const mode = currentMode();

  if (mode === "deterministic_only") {
    return {
      provider: "deterministic",
      mode,
      fallbackUsed: false,
      evaluatorResponse: null,
      finalResult: fallback,
      warnings: ["Deterministic-only evaluation mode is active."],
    };
  }

  try {
    const rawResponse =
      mode === "hud_remote"
        ? await callHudEvaluator(request)
        : buildLocalMockResponse(request, fallback);
    const validated = validateExternalEvaluatorResponse(rawResponse, request, fallback);

    if (!validated.accepted) {
      return {
        provider: "deterministic",
        mode,
        fallbackUsed: true,
        evaluatorResponse: null,
        finalResult: fallback,
        warnings: validated.warnings,
      };
    }

    return {
      provider: mode === "hud_remote" ? "hud_remote" : "external_mock",
      mode,
      fallbackUsed: false,
      evaluatorResponse: validated.response,
      finalResult: validated.finalResult,
      warnings: validated.warnings,
      traceId: validated.response?.traceId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "External evaluator was unavailable.";
    return {
      provider: "deterministic",
      mode,
      fallbackUsed: true,
      evaluatorResponse: null,
      finalResult: fallback,
      warnings: [
        `${message} Credora stored the deterministic rubric result so the profile remains usable.`,
      ],
    };
  }
}
