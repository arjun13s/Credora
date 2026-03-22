// Compatibility barrel for the evaluation pipeline.
// Deterministic normalization and rubric logic live in dedicated modules so the
// app can integrate with an external HUD evaluator without embedding LLM logic.

export {
  buildEvidenceItems,
  buildNormalizedEvidenceBundle,
  normalizeApplicantInput,
} from "@/lib/evidence-normalizer";
export { buildDeterministicEvaluation } from "@/lib/rubric";
