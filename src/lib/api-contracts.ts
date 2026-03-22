import type {
  ApplicantProfileInput,
  ApplicantProfileView,
  ConfidenceBand,
  FinalGradingResult,
  GradingResult,
  ProfileStatus,
  RecommendationStatus,
  TrustBand,
  UseCase,
} from "@/lib/types";

export type RecursivePartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object
      ? RecursivePartial<T[K]>
      : T[K];
};

export interface ApiError {
  code:
    | "invalid_payload"
    | "validation_failed"
    | "profile_not_found"
    | "draft_not_found"
    | "submission_required"
    | "internal_error";
  message: string;
  details?: unknown;
}

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface CreateDraftRequest {
  input?: RecursivePartial<ApplicantProfileInput>;
}

export interface UpdateDraftRequest {
  input: RecursivePartial<ApplicantProfileInput>;
}

export interface SubmitProfileRequest {
  input?: RecursivePartial<ApplicantProfileInput>;
}

export interface ProfileSummary {
  profileId: string;
  applicantId: string;
  fullName: string;
  email: string;
  useCase: UseCase;
  status: ProfileStatus;
  shareStatus: ApplicantProfileView["profile"]["shareStatus"];
  updatedAt: string;
  recommendationStatus?: RecommendationStatus;
  confidence?: ConfidenceBand;
  overallBand?: TrustBand;
}

export interface DraftSnapshot {
  draftId: string;
  profileId: string;
  applicantId: string;
  version: number;
  completionPercent: number;
  updatedAt: string;
  input: ApplicantProfileInput;
}

export interface EvaluationResultPayload {
  profileId: string;
  status: ProfileStatus;
  result?: FinalGradingResult;
  grading?: Pick<
    GradingResult,
    | "id"
    | "provider"
    | "mode"
    | "fallbackUsed"
    | "warnings"
    | "traceId"
    | "createdAt"
    | "rubricVersion"
  >;
}

export interface ProfileStatusPayload {
  profileId: string;
  status: ProfileStatus;
  draftUpdatedAt?: string;
  submittedAt?: string;
  latestEvaluationAt?: string;
  recommendationStatus?: RecommendationStatus;
}

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(error: ApiError): ApiFailure {
  return { ok: false, error };
}
