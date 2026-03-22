export type {
  EvaluationMode,
  ExternalEvaluatorRequest,
  ExternalEvaluatorResponse,
  FinalGradingResult,
  GradingProvider,
} from "@/lib/types";

export const SUPPORTED_EVALUATION_MODES = [
  "deterministic_only",
  "local_mock",
  "hud_remote",
] as const;
