import type {
  CategoryAssessment,
  ConfidenceBand,
  ExternalEvaluatorRequest,
  ExternalEvaluatorResponse,
  FinalGradingResult,
  RecommendationStatus,
  TrustBand,
} from "@/lib/types";

function sanitizeList(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").slice(0, limit);
}

function sanitizeBand(value: unknown, fallback: TrustBand): TrustBand {
  return value === "Strong" || value === "Moderate" || value === "Weak" || value === "Unknown"
    ? value
    : fallback;
}

function sanitizeConfidence(value: unknown, fallback: ConfidenceBand): ConfidenceBand {
  return value === "High" || value === "Medium" || value === "Low" ? value : fallback;
}

function sanitizeRecommendation(
  value: unknown,
  fallback: RecommendationStatus,
): RecommendationStatus {
  return value === "Recommended" ||
    value === "Needs manual review" ||
    value === "Insufficient evidence" ||
    value === "Potential inconsistency detected"
    ? value
    : fallback;
}

function bandFromScore(score: number | null): TrustBand {
  if (score === null) {
    return "Unknown";
  }
  if (score >= 75) {
    return "Strong";
  }
  if (score >= 40) {
    return "Moderate";
  }
  return "Weak";
}

function sanitizeCategoryScore(value: unknown): number | null | undefined {
  if (typeof value === "number") {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  if (value === null) {
    return null;
  }

  return undefined;
}

function hasContradiction(request: ExternalEvaluatorRequest) {
  return request.deterministicFeatures.contradictions.length > 0;
}

function insufficientCoverage(request: ExternalEvaluatorRequest) {
  return request.deterministicFeatures.verifiedCategoryCount < 2;
}

function coerceRecommendation(
  recommendation: RecommendationStatus,
  confidence: ConfidenceBand,
  request: ExternalEvaluatorRequest,
): RecommendationStatus {
  if (hasContradiction(request)) {
    return "Potential inconsistency detected";
  }

  if (insufficientCoverage(request)) {
    return "Insufficient evidence";
  }

  if (recommendation === "Recommended" && confidence === "Low") {
    return "Needs manual review";
  }

  return recommendation;
}

export function validateExternalEvaluatorResponse(
  candidate: unknown,
  request: ExternalEvaluatorRequest,
  fallback: FinalGradingResult,
): {
  accepted: boolean;
  finalResult: FinalGradingResult;
  response: ExternalEvaluatorResponse | null;
  warnings: string[];
} {
  if (!candidate || typeof candidate !== "object") {
    return {
      accepted: false,
      finalResult: fallback,
      response: null,
      warnings: ["External evaluator response was missing or malformed."],
    };
  }

  const parsed = candidate as Partial<ExternalEvaluatorResponse>;
  const warnings = sanitizeList(parsed.warnings, 8);
  const requestIdMatches =
    typeof parsed.requestId === "string" && parsed.requestId === request.requestId;
  const modeValid =
    parsed.mode === "deterministic_only" ||
    parsed.mode === "local_mock" ||
    parsed.mode === "hud_remote";
  const providerValid =
    parsed.provider === "external_mock" || parsed.provider === "hud_remote";
  const syncCompleted = parsed.status === "completed";

  if (!requestIdMatches || !modeValid || !providerValid || !syncCompleted) {
    return {
      accepted: false,
      finalResult: fallback,
      response: null,
      warnings: [
        ...warnings,
        "External evaluator response failed core contract checks and was rejected.",
      ],
    };
  }

  const requestId = parsed.requestId as string;
  const mode = parsed.mode as ExternalEvaluatorResponse["mode"];
  const provider = parsed.provider as ExternalEvaluatorResponse["provider"];
  const status = parsed.status as ExternalEvaluatorResponse["status"];

  const overallScore =
    typeof parsed.overallScore === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
      : parsed.overallScore === null
        ? null
        : fallback.overallScore;
  const canonicalBand = bandFromScore(overallScore);
  const requestedBand = sanitizeBand(parsed.overallBand, canonicalBand);
  const overallBand = requestedBand === canonicalBand ? requestedBand : canonicalBand;

  if (requestedBand !== canonicalBand) {
    warnings.push("External evaluator overall band did not match the score and was normalized.");
  }

  const confidence = sanitizeConfidence(parsed.confidence, fallback.confidence);
  const recommendation = coerceRecommendation(
    sanitizeRecommendation(parsed.recommendationStatus, fallback.recommendationStatus),
    confidence,
    request,
  );

  const response: ExternalEvaluatorResponse = {
    requestId,
    mode,
    provider,
    status,
    overallScore,
    overallBand,
    confidence,
    recommendationStatus: recommendation,
    categoryScores: parsed.categoryScores,
    categoryBands: parsed.categoryBands,
    strengths: sanitizeList(parsed.strengths).length > 0 ? sanitizeList(parsed.strengths) : fallback.strengths,
    riskFlags: sanitizeList(parsed.riskFlags).length > 0 ? sanitizeList(parsed.riskFlags) : fallback.riskFlags,
    issues: sanitizeList(parsed.issues).length > 0 ? sanitizeList(parsed.issues) : fallback.issues,
    missingEvidence:
      sanitizeList(parsed.missingEvidence).length > 0
        ? sanitizeList(parsed.missingEvidence)
        : fallback.missingEvidence,
    evidenceUsed:
      sanitizeList(parsed.evidenceUsed, 8).length > 0
        ? sanitizeList(parsed.evidenceUsed, 8)
        : fallback.evidenceUsed,
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary
        : fallback.summary,
    manualReviewTriggers:
      sanitizeList(parsed.manualReviewTriggers).length > 0
        ? sanitizeList(parsed.manualReviewTriggers)
        : fallback.manualReviewTriggers,
    confidenceNotes:
      sanitizeList(parsed.confidenceNotes).length > 0
        ? sanitizeList(parsed.confidenceNotes)
        : fallback.confidenceNotes,
    warnings,
    traceId: typeof parsed.traceId === "string" ? parsed.traceId : undefined,
    evaluatedAt:
      typeof parsed.evaluatedAt === "string" && parsed.evaluatedAt.length > 0
        ? parsed.evaluatedAt
        : new Date().toISOString(),
  };

  const finalResult: FinalGradingResult = {
    overallScore: response.overallScore,
    overallBand: response.overallBand,
    confidence: response.confidence,
    recommendationStatus: response.recommendationStatus,
    strengths: response.strengths,
    riskFlags: response.riskFlags,
    issues: response.issues,
    missingEvidence: response.missingEvidence,
    evidenceUsed: response.evidenceUsed,
    summary: response.summary,
    manualReviewTriggers: response.manualReviewTriggers,
    confidenceNotes: response.confidenceNotes,
    categoryAssessments: fallback.categoryAssessments.map((category): CategoryAssessment => {
      const candidateScore = sanitizeCategoryScore(response.categoryScores?.[category.key]);
      const normalizedScore =
        candidateScore === undefined ? category.score : candidateScore;
      const candidateBand = response.categoryBands?.[category.key];
      const normalizedBand = bandFromScore(normalizedScore);

      if (
        candidateBand !== undefined &&
        sanitizeBand(candidateBand, normalizedBand) !== normalizedBand
      ) {
        warnings.push(`Category ${category.key} band did not match its score and was normalized.`);
      }

      return {
        ...category,
        score: normalizedScore,
        band: normalizedBand,
      };
    }),
  };

  return {
    accepted: true,
    finalResult,
    response,
    warnings,
  };
}
