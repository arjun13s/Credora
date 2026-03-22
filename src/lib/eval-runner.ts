import { buildExternalEvaluatorRequest, evaluatePreparedProfile } from "@/lib/evaluator-client";
import { buildNormalizedEvidenceBundle, normalizeApplicantInput } from "@/lib/evidence-normalizer";
import { buildDeterministicEvaluation } from "@/lib/rubric";
import { syntheticEvaluationCases } from "@/lib/synthetic-cases";
import type { EvaluationCaseFixture, EvaluationRunResult } from "@/lib/types";

export async function runSyntheticEvaluatorCases(
  cases: EvaluationCaseFixture[] = syntheticEvaluationCases,
  options?: {
    mode?: "deterministic_only" | "local_mock" | "hud_remote";
  },
): Promise<EvaluationRunResult[]> {
  const results: EvaluationRunResult[] = [];
  const originalMode = process.env.CREDORA_EVALUATOR_MODE;
  process.env.CREDORA_EVALUATOR_MODE = options?.mode ?? "deterministic_only";

  try {
    for (const fixture of cases) {
      const profileId = `fixture-profile-${fixture.id}`;
      const submissionId = `fixture-submission-${fixture.id}`;
      const normalizedInput = normalizeApplicantInput(fixture.input);
      const bundle = buildNormalizedEvidenceBundle(profileId, submissionId, normalizedInput);
      const deterministic = buildDeterministicEvaluation(bundle);
      const request = buildExternalEvaluatorRequest({
        profileId,
        submissionId,
        input: normalizedInput,
        normalizedEvidence: bundle,
        deterministicFeatures: deterministic.features,
      });
      const evaluated = await evaluatePreparedProfile(request, deterministic.finalResult);
      const result = evaluated.finalResult;
      const messages: string[] = [];

      if (result.recommendationStatus !== fixture.expected.recommendationStatus) {
        messages.push(
          `Expected recommendation ${fixture.expected.recommendationStatus} but received ${result.recommendationStatus}.`,
        );
      }

      if (result.confidence !== fixture.expected.confidence) {
        messages.push(
          `Expected confidence ${fixture.expected.confidence} but received ${result.confidence}.`,
        );
      }

      if (result.overallBand !== fixture.expected.overallBand) {
        messages.push(
          `Expected overall band ${fixture.expected.overallBand} but received ${result.overallBand}.`,
        );
      }

      if (fixture.expected.scoreRange && typeof result.overallScore === "number") {
        if (
          result.overallScore < fixture.expected.scoreRange.min ||
          result.overallScore > fixture.expected.scoreRange.max
        ) {
          messages.push(
            `Expected score between ${fixture.expected.scoreRange.min}-${fixture.expected.scoreRange.max} but received ${result.overallScore}.`,
          );
        }
      }

      fixture.expected.expectedReasonCodes?.forEach((code) => {
        if (!request.deterministicFeatures.reasonCodes.includes(code)) {
          messages.push(`Expected reason code ${code} was not present.`);
        }
      });

      fixture.expected.forbiddenReasonCodes?.forEach((code) => {
        if (request.deterministicFeatures.reasonCodes.includes(code)) {
          messages.push(`Forbidden reason code ${code} was present.`);
        }
      });

      Object.entries(fixture.expected.expectedCategoryBands ?? {}).forEach(([key, expectedBand]) => {
        const category = result.categoryAssessments.find((entry) => entry.key === key);
        if (!category) {
          messages.push(`Expected category ${key} was missing from the result.`);
          return;
        }

        if (category.band !== expectedBand) {
          messages.push(`Expected category ${key} to be ${expectedBand} but received ${category.band}.`);
        }
      });

      if (
        typeof fixture.expected.minimumEvidenceUsed === "number" &&
        result.evidenceUsed.length < fixture.expected.minimumEvidenceUsed
      ) {
        messages.push(
          `Expected at least ${fixture.expected.minimumEvidenceUsed} evidence labels but received ${result.evidenceUsed.length}.`,
        );
      }

      if (
        fixture.expected.expectedProvider &&
        evaluated.provider !== fixture.expected.expectedProvider
      ) {
        messages.push(
          `Expected provider ${fixture.expected.expectedProvider} but received ${evaluated.provider}.`,
        );
      }

      if (fixture.expected.expectedMode && evaluated.mode !== fixture.expected.expectedMode) {
        messages.push(`Expected mode ${fixture.expected.expectedMode} but received ${evaluated.mode}.`);
      }
      if (
        typeof fixture.expected.expectFallbackUsed === "boolean" &&
        evaluated.fallbackUsed !== fixture.expected.expectFallbackUsed
      ) {
        messages.push(
          `Expected fallbackUsed=${fixture.expected.expectFallbackUsed} but received ${evaluated.fallbackUsed}.`,
        );
      }
      if (
        typeof fixture.expected.maximumWarnings === "number" &&
        evaluated.warnings.length > fixture.expected.maximumWarnings
      ) {
        messages.push(
          `Expected at most ${fixture.expected.maximumWarnings} warnings but received ${evaluated.warnings.length}.`,
        );
      }

      results.push({
        caseId: fixture.id,
        passed: messages.length === 0,
        messages,
        result,
      });
    }
  } finally {
    if (originalMode) {
      process.env.CREDORA_EVALUATOR_MODE = originalMode;
    } else {
      delete process.env.CREDORA_EVALUATOR_MODE;
    }
  }

  return results;
}
