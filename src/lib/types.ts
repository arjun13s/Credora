export type UseCase = "tenant_screening";

export type TrustBand = "Strong" | "Moderate" | "Weak" | "Unknown";
export type ConfidenceBand = "High" | "Medium" | "Low";
export type EvaluationMode = "deterministic_only" | "local_mock" | "hud_remote";
export type RecommendationStatus =
  | "Recommended"
  | "Needs manual review"
  | "Insufficient evidence"
  | "Potential inconsistency detected";
export type HudDecisionBand = "recommend" | "needs_manual_review";
export type HudCategoryKey =
  | "identity"
  | "income"
  | "housing"
  | "payment"
  | "employment"
  | "completeness"
  | "consistency";
export type VerificationState = "verified" | "self_reported" | "missing";
export type ConsentStatus = "active" | "revoked";
export type PublicationStatus = "private" | "published";
export type ProfileStatus =
  | "draft"
  | "submitted"
  | "grading"
  | "complete"
  | "needs_review"
  | "error";
export type ReviewerRole = "applicant" | "reviewer" | "system";
export type GradingProvider = "deterministic" | "external_mock" | "hud_remote";
export type EvidenceProvenanceKind = "verified" | "self_reported" | "derived";
export type EvidenceSourceKind =
  | "applicant_form"
  | "uploaded_document"
  | "bank_connection"
  | "system_rule"
  | "external_evaluator";

export type ConsentSource =
  | "identity_check"
  | "bank_connection"
  | "income_docs"
  | "housing_docs";

export type EmploymentStatus =
  | "full_time"
  | "part_time"
  | "self_employed"
  | "gig_worker"
  | "student"
  | "between_roles";

export type IncomeType =
  | "salary"
  | "hourly"
  | "contract"
  | "gig"
  | "stipend"
  | "mixed";

export type PayFrequency =
  | "weekly"
  | "biweekly"
  | "semi_monthly"
  | "monthly"
  | "irregular";

export type IdentityMethod =
  | "government_id"
  | "passport"
  | "state_id"
  | "bank_account_match"
  | "manual_review";

export type EvidenceCategory =
  | "identity"
  | "income"
  | "housing"
  | "payments"
  | "financial_stability"
  | "employment"
  | "completeness"
  | "inconsistency";

export interface PersonalInformationInput {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  targetRent: number;
}

export interface IdentityVerificationInput {
  identityMethod: IdentityMethod | "";
  identityVerified: boolean;
  governmentIdFileNames: string[];
  accountOwnerMatch: boolean;
}

export interface EmploymentIncomeInput {
  employmentStatus: EmploymentStatus | "";
  employerName: string;
  monthlyIncome: number;
  incomeType: IncomeType | "";
  payFrequency: PayFrequency | "";
  payStubFileNames: string[];
  contractDocumentFileNames: string[];
}

export interface HousingHistoryInput {
  currentRent: number;
  monthsAtResidence: number;
  rentPaymentStreakMonths: number;
  utilityPaymentStreakMonths: number;
  leaseFileNames: string[];
  rentLedgerFileNames: string[];
  receiptsFileNames: string[];
  landlordReferenceName: string;
}

export interface FinancialStabilityInput {
  bankConnected: boolean;
  averageBalanceCushion: number;
  overdraftsLast90Days: number;
  recurringBillsTracked: boolean;
  signalRecencyDays: number;
  contradictionDetected: boolean;
}

export interface SupportingDocumentsInput {
  additionalFileNames: string[];
}

export interface ApplicantConsentInput {
  identity_check: boolean;
  bank_connection: boolean;
  income_docs: boolean;
  housing_docs: boolean;
  consentToSubmit: boolean;
  retentionAcknowledged: boolean;
}

export interface ApplicantProfileInput {
  useCase: UseCase;
  personalInformation: PersonalInformationInput;
  identityVerification: IdentityVerificationInput;
  employmentIncome: EmploymentIncomeInput;
  housingHistory: HousingHistoryInput;
  financialStability: FinancialStabilityInput;
  supportingDocuments: SupportingDocumentsInput;
  consents: ApplicantConsentInput;
}

export interface Applicant {
  id: string;
  auth0UserId?: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  createdAt: string;
}

export interface ApplicantProfile {
  id: string;
  applicantId: string;
  useCase: UseCase;
  status: ProfileStatus;
  hudCaseId?: string;
  currentDraftId?: string;
  currentSubmissionId?: string;
  latestGradingResultId?: string;
  latestPublishedSnapshotId?: string;
  latestPublishedGradingResultId?: string;
  publicationStatus: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDraft {
  id: string;
  profileId: string;
  applicantId: string;
  input: ApplicantProfileInput;
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProfileSubmission {
  id: string;
  profileId: string;
  hudCaseId?: string;
  submittedAt: string;
  rawFormSnapshot: ApplicantProfileInput;
  version: number;
}

export interface EvidenceItem {
  id: string;
  submissionId: string;
  category: EvidenceCategory;
  sourceType: ConsentSource | "self_report" | "system";
  verificationState: VerificationState;
  label: string;
  detail: string;
  metadata: Record<string, string | number | boolean | null | string[]>;
  filePath?: string;
  shareIncluded: boolean;
}

export interface ConsentRecord {
  id: string;
  profileId: string;
  submissionId: string;
  source: ConsentSource;
  grantedAt: string;
  expiresAt: string;
  status: ConsentStatus;
  scope: string;
}

export interface EvidenceProvenance {
  kind: EvidenceProvenanceKind;
  source: EvidenceSourceKind;
  consentSource?: ConsentSource;
  confidence: number;
  capturedAt: string;
  note?: string;
}

export interface ApplicantContext {
  city: string;
  state: string;
  targetRent: number;
  currentRent: number;
}

export interface IdentityEvidenceInput {
  method: IdentityMethod | "";
  identityVerified: boolean;
  accountOwnerMatch: boolean;
  governmentIdDocumentCount: number;
  provenance: EvidenceProvenance;
}

export interface IncomeEvidenceInput {
  employmentStatus: EmploymentStatus | "";
  incomeType: IncomeType | "";
  payFrequency: PayFrequency | "";
  monthlyIncome: number;
  incomeCoverageRatio: number | null;
  payStubDocumentCount: number;
  contractDocumentCount: number;
  employerNameProvided: boolean;
  provenance: EvidenceProvenance;
}

export interface HousingEvidenceInput {
  currentRent: number;
  monthsAtResidence: number;
  rentPaymentStreakMonths: number;
  utilityPaymentStreakMonths: number;
  leasePresent: boolean;
  rentLedgerPresent: boolean;
  receiptsPresent: boolean;
  landlordReferencePresent: boolean;
  provenance: EvidenceProvenance;
}

export interface PaymentHistoryEvidenceInput {
  bankConnected: boolean;
  averageBalanceCushion: number;
  overdraftsLast90Days: number;
  recurringBillsTracked: boolean;
  signalRecencyDays: number;
  provenance: EvidenceProvenance;
}

export interface EmploymentEvidenceInput {
  employerNameProvided: boolean;
  contractPresent: boolean;
  payStubPresent: boolean;
  provenance: EvidenceProvenance;
}

export interface DataCompletenessEvidenceInput {
  requiredFieldCodesPresent: string[];
  missingFieldCodes: string[];
  optionalSignalCodesPresent: string[];
  staleSignalCodes: string[];
  signalRecencyDays: number;
  provenance: EvidenceProvenance;
}

export interface InconsistencyEvidenceInput {
  contradictionDetected: boolean;
  flags: string[];
  severity: "none" | "low" | "medium" | "high";
  provenance: EvidenceProvenance;
}

export interface NormalizedEvidenceBundle {
  schemaVersion: string;
  profileId: string;
  submissionId: string;
  useCase: UseCase;
  generatedAt: string;
  applicantContext: ApplicantContext;
  identity: IdentityEvidenceInput;
  income: IncomeEvidenceInput;
  housing: HousingEvidenceInput;
  payments: PaymentHistoryEvidenceInput;
  employment: EmploymentEvidenceInput;
  completeness: DataCompletenessEvidenceInput;
  inconsistencies: InconsistencyEvidenceInput;
  summary: {
    verifiedCount: number;
    selfReportedCount: number;
    derivedCount: number;
    missingCount: number;
  };
}

export interface CategoryAssessment {
  key:
    | "identity_confidence"
    | "income_stability"
    | "housing_history"
    | "payment_consistency"
    | "financial_stability"
    | "completeness_recency";
  title: string;
  score: number | null;
  band: TrustBand;
  rationale: string;
  evidenceLabels: string[];
  flags: string[];
  coverage: "verified" | "self_reported" | "mixed" | "missing";
}

export interface DeterministicFeatureSet {
  weightedScore: number | null;
  weightedBand: TrustBand;
  confidenceFloor: ConfidenceBand;
  coverageScore: number;
  contradictions: string[];
  thinFile: boolean;
  verifiedEvidenceCount: number;
  verifiedCategoryCount: number;
  selfReportedCategoryCount: number;
  missingEvidence: string[];
  strengths: string[];
  issues: string[];
  manualReviewTriggers: string[];
  reasonCodes: string[];
  rubricWeights: Record<CategoryAssessment["key"], number>;
  categoryAssessments: CategoryAssessment[];
}

export interface FinalGradingResult {
  overallScore: number | null;
  overallBand: TrustBand;
  confidence: ConfidenceBand;
  recommendationStatus: RecommendationStatus;
  strengths: string[];
  riskFlags: string[];
  issues: string[];
  missingEvidence: string[];
  evidenceUsed: string[];
  summary: string;
  manualReviewTriggers: string[];
  confidenceNotes: string[];
  categoryAssessments: CategoryAssessment[];
  hudDecisionBand: HudDecisionBand;
  hudCategoryScores: Record<HudCategoryKey, number>;
  numericConfidence: number;
}

export interface ExternalEvaluatorRequest {
  requestId: string;
  caseId?: string;
  profileId: string;
  submissionId: string;
  useCase: UseCase;
  rubricVersion: string;
  schemaVersion: string;
  createdAt: string;
  applicantContext: ApplicantContext;
  normalizedEvidence: NormalizedEvidenceBundle;
  deterministicFeatures: DeterministicFeatureSet;
  policy: {
    purposeLimitedUse: "tenant_screening";
    missingDataMeansUncertainty: true;
    noProtectedTraitInference: true;
    manualReviewRequiredForInconsistency: true;
  };
}

export interface ExternalEvaluatorResponse {
  requestId: string;
  mode: EvaluationMode;
  provider: Exclude<GradingProvider, "deterministic">;
  status: "completed" | "pending" | "unavailable";
  overallScore: number | null;
  overallBand: TrustBand;
  confidence: ConfidenceBand;
  recommendationStatus: RecommendationStatus;
  categoryScores?: Partial<Record<CategoryAssessment["key"], number | null>>;
  categoryBands?: Partial<Record<CategoryAssessment["key"], TrustBand>>;
  strengths: string[];
  riskFlags: string[];
  issues: string[];
  missingEvidence: string[];
  evidenceUsed: string[];
  summary: string;
  manualReviewTriggers: string[];
  confidenceNotes: string[];
  warnings?: string[];
  traceId?: string;
  evaluatedAt: string;
}

export interface GradingResult {
  id: string;
  profileId: string;
  submissionId: string;
  rubricVersion: string;
  evaluationStatus: "completed" | "fallback_completed";
  externalRequestId?: string;
  provider: GradingProvider;
  mode: EvaluationMode;
  deterministicFeatures: DeterministicFeatureSet;
  evaluatorRequest?: ExternalEvaluatorRequest;
  evaluatorResponse?: ExternalEvaluatorResponse | null;
  hudRecommendationPreview?: HudRecommendationPayload;
  finalResult: FinalGradingResult;
  fallbackUsed: boolean;
  warnings: string[];
  traceId?: string;
  createdAt: string;
}

export interface DisputeCase {
  id: string;
  profileId: string;
  submissionId?: string;
  gradingResultId?: string;
  publishedSnapshotId?: string;
  field: string;
  explanation: string;
  status: "open" | "under_review";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  profileId: string;
  actor: ReviewerRole;
  action: string;
  detail: string;
  at: string;
}

export interface AttestationRecord {
  id: string;
  profileId: string;
  publishedSnapshotId?: string;
  type: "signed_profile_export" | "published_snapshot_attestation";
  attestationStatus: "demo" | "signed" | "anchored";
  payloadHash: string;
  signature: string;
  chainAnchor?: string;
  createdAt: string;
}

export interface HudRecommendationPayload {
  case_id: string;
  submission_id: string;
  recommendation: {
    recommendation: HudDecisionBand;
    decision_band: HudDecisionBand;
    overall_score: number;
    confidence: number;
    display_rating: string;
    category_scores: Record<HudCategoryKey, number>;
    strengths: string[];
    risks: string[];
    issues: string[];
    missing_evidence: string[];
    manual_review_reasons: string[];
    inconsistency_flags: string[];
    summary: string;
  };
}

export interface PublishedProfileSnapshot {
  id: string;
  profileId: string;
  applicantId: string;
  submissionId: string;
  gradingResultId: string;
  versionNumber: number;
  previousSnapshotId?: string;
  previousSnapshotHash?: string;
  publicDisplayName: string;
  payloadHash: string;
  publishedAt: string;
  publishedByApplicantConfirmedAt: string;
  disclosureVersion: string;
  publicPayload: {
    schemaVersion: string;
    applicantName: string;
    useCase: UseCase;
    overallScore: number | null;
    overallBand: TrustBand;
    confidence: ConfidenceBand;
    recommendationStatus: RecommendationStatus;
    summary: string;
    strengths: string[];
    riskFlags: string[];
    issues: string[];
    categoryAssessments: CategoryAssessment[];
    rubricVersion: string;
  };
}

export interface PublishedSnapshotView {
  id: string;
  profileId: string;
  applicantId: string;
  applicantName: string;
  versionNumber: number;
  gradingResultId: string;
  previousSnapshotId?: string;
  previousSnapshotHash?: string;
  nextSnapshotId?: string;
  isLatestVersion: boolean;
  payloadHash: string;
  publishedAt: string;
  useCase: UseCase;
  overallScore: number | null;
  overallBand: TrustBand;
  confidence: ConfidenceBand;
  recommendationStatus: RecommendationStatus;
  summary: string;
  strengths: string[];
  riskFlags: string[];
  issues: string[];
  categoryAssessments: CategoryAssessment[];
  rubricVersion: string;
  attestation?: Pick<
    AttestationRecord,
    "id" | "attestationStatus" | "payloadHash" | "signature" | "chainAnchor" | "createdAt"
  >;
}

export interface ApplicantProfileView {
  applicant: Applicant;
  profile: ApplicantProfile;
  submission: ProfileSubmission;
  evidence: EvidenceItem[];
  consents: ConsentRecord[];
  gradingResult?: GradingResult;
  latestPublishedSnapshot?: PublishedSnapshotView;
  publishedSnapshots: PublishedSnapshotView[];
  canPublishSnapshot: boolean;
  disputes: DisputeCase[];
  auditLogs: AuditLog[];
}

export interface PersistedDatabase {
  schemaVersion: string;
  applicants: Applicant[];
  profiles: ApplicantProfile[];
  drafts: ApplicationDraft[];
  submissions: ProfileSubmission[];
  evidenceItems: EvidenceItem[];
  consentRecords: ConsentRecord[];
  gradingResults: GradingResult[];
  publishedSnapshots: PublishedProfileSnapshot[];
  disputes: DisputeCase[];
  auditLogs: AuditLog[];
  attestations: AttestationRecord[];
}

export interface DemoScenario {
  key: string;
  label: string;
  description: string;
  input: ApplicantProfileInput;
}

export interface EvaluationCaseExpectation {
  recommendationStatus: RecommendationStatus;
  confidence: ConfidenceBand;
  overallBand: TrustBand;
  scoreRange?: {
    min: number;
    max: number;
  };
  expectedReasonCodes?: string[];
  forbiddenReasonCodes?: string[];
  expectedCategoryBands?: Partial<Record<CategoryAssessment["key"], TrustBand>>;
  minimumEvidenceUsed?: number;
  expectedProvider?: GradingProvider;
  expectedMode?: EvaluationMode;
  expectFallbackUsed?: boolean;
  maximumWarnings?: number;
}

export interface EvaluationCaseFixture {
  id: string;
  title: string;
  purpose: string;
  tags: string[];
  schemaVersion: string;
  rubricVersion: string;
  input: ApplicantProfileInput;
  expected: EvaluationCaseExpectation;
}

export interface EvaluationRunResult {
  caseId: string;
  passed: boolean;
  messages: string[];
  result: FinalGradingResult;
}
