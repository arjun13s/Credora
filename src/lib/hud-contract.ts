import type {
  ConfidenceBand,
  DeterministicFeatureSet,
  FinalGradingResult,
  HudCategoryKey,
  HudDecisionBand,
  HudRecommendationPayload,
  NormalizedEvidenceBundle,
  RecommendationStatus,
} from "@/lib/types";

const HUD_CATEGORY_KEYS: HudCategoryKey[] = [
  "identity",
  "income",
  "housing",
  "payment",
  "employment",
  "completeness",
  "consistency",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getAssessmentScore(
  result: FinalGradingResult,
  key:
    | "identity_confidence"
    | "income_stability"
    | "housing_history"
    | "payment_consistency"
    | "financial_stability"
    | "completeness_recency",
) {
  return result.categoryAssessments.find((category) => category.key === key)?.score ?? null;
}

export function toHudDecisionBand(recommendation: RecommendationStatus): HudDecisionBand {
  return recommendation === "Recommended" ? "recommend" : "needs_manual_review";
}

export function toHudNumericConfidence(confidence: ConfidenceBand): number {
  switch (confidence) {
    case "High":
      return 85;
    case "Medium":
      return 68;
    default:
      return 45;
  }
}

export function buildHudCategoryScores(args: {
  result: FinalGradingResult;
  features: DeterministicFeatureSet;
  normalizedEvidence: NormalizedEvidenceBundle;
}): Record<HudCategoryKey, number> {
  const { result, features, normalizedEvidence } = args;
  const employmentScore = clamp(
    30 +
      (normalizedEvidence.employment.employerNameProvided ? 20 : 0) +
      (normalizedEvidence.employment.payStubPresent ? 28 : 0) +
      (normalizedEvidence.employment.contractPresent ? 18 : 0) +
      (normalizedEvidence.income.employmentStatus === "between_roles" ? -18 : 0) +
      (normalizedEvidence.income.employmentStatus === "gig_worker" ? -4 : 8),
    0,
    100,
  );
  const consistencyScore = clamp(
    100 -
      features.contradictions.length * 45 -
      normalizedEvidence.inconsistencies.flags.length * 15,
    0,
    100,
  );

  const scores: Record<HudCategoryKey, number> = {
    identity: getAssessmentScore(result, "identity_confidence") ?? 0,
    income: getAssessmentScore(result, "income_stability") ?? 0,
    housing: getAssessmentScore(result, "housing_history") ?? 0,
    payment: getAssessmentScore(result, "payment_consistency") ?? 0,
    employment: employmentScore,
    completeness: getAssessmentScore(result, "completeness_recency") ?? 0,
    consistency: consistencyScore,
  };

  HUD_CATEGORY_KEYS.forEach((key) => {
    scores[key] = clamp(Math.round(scores[key]), 0, 100);
  });

  return scores;
}

export function buildHudRecommendationPayload(args: {
  caseId: string;
  submissionId: string;
  result: FinalGradingResult;
  features: DeterministicFeatureSet;
  normalizedEvidence: NormalizedEvidenceBundle;
}): HudRecommendationPayload {
  const hudDecisionBand = toHudDecisionBand(args.result.recommendationStatus);
  const overallScore = args.result.overallScore ?? 0;
  const numericConfidence = toHudNumericConfidence(args.result.confidence);
  const categoryScores = buildHudCategoryScores(args);

  return {
    case_id: args.caseId,
    submission_id: `${args.caseId}-${args.submissionId.slice(0, 8)}`,
    recommendation: {
      recommendation: hudDecisionBand,
      decision_band: hudDecisionBand,
      overall_score: overallScore,
      confidence: numericConfidence,
      display_rating: String(overallScore),
      category_scores: categoryScores,
      strengths: args.result.strengths,
      risks: args.result.riskFlags,
      issues: args.result.issues,
      missing_evidence: args.result.missingEvidence,
      manual_review_reasons: args.result.manualReviewTriggers,
      inconsistency_flags: args.features.contradictions,
      summary: args.result.summary,
    },
  };
}
