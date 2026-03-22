import { buildExternalEvaluatorRequest, evaluatePreparedProfile } from "@/lib/evaluator-client";
import {
  buildEvidenceItems,
  buildNormalizedEvidenceBundle,
  normalizeApplicantInput,
} from "@/lib/grading";
import type {
  ApplicantProfileInput,
  DeterministicFeatureSet,
  EvidenceItem,
  ExternalEvaluatorRequest,
  FinalGradingResult,
  NormalizedEvidenceBundle,
} from "@/lib/types";
import type { ValidationIssue } from "@/lib/validators";
import { validateApplicantProfileInput } from "@/lib/validators";

export type HudEvaluationScenario = "screen_applicant_case";

export interface PreparedApplicationEvidence {
  normalizedInput: ApplicantProfileInput;
  normalizedEvidence: NormalizedEvidenceBundle;
  evidenceItems: EvidenceItem[];
}

export interface HudEvaluationRoute {
  scenario: HudEvaluationScenario;
  routeKey: string;
  reason: string;
}

export function validateApplicationForEvaluation(
  input: ApplicantProfileInput,
): ValidationIssue[] {
  return validateApplicantProfileInput(input);
}

export function normalizeApplicationEvidence(args: {
  profileId: string;
  submissionId: string;
  input: ApplicantProfileInput;
}): PreparedApplicationEvidence {
  const normalizedInput = normalizeApplicantInput(args.input);
  return {
    normalizedInput,
    normalizedEvidence: buildNormalizedEvidenceBundle(
      args.profileId,
      args.submissionId,
      normalizedInput,
    ),
    evidenceItems: buildEvidenceItems(args.submissionId, normalizedInput),
  };
}

export function chooseEvaluationMode(args: {
  input: ApplicantProfileInput;
  normalizedEvidence: NormalizedEvidenceBundle;
}): HudEvaluationRoute {
  void args;
  return {
    scenario: "screen_applicant_case",
    routeKey: "screen_applicant_case",
    reason:
      "Credora demo routing is backend-owned and currently hardcoded to the single supported HUD scenario.",
  };
}

export function buildHudEvaluationRequest(args: {
  caseId?: string;
  profileId: string;
  submissionId: string;
  input: ApplicantProfileInput;
  normalizedEvidence: NormalizedEvidenceBundle;
  deterministicFeatures: DeterministicFeatureSet;
}): ExternalEvaluatorRequest {
  return buildExternalEvaluatorRequest(args);
}

export async function runHudEvaluation(args: {
  route: HudEvaluationRoute;
  evaluatorRequest: ExternalEvaluatorRequest;
  fallback: FinalGradingResult;
}) {
  void args.route;
  return evaluatePreparedProfile(args.evaluatorRequest, args.fallback);
}
