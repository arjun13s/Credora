export type PersonaKey = "newcomer" | "gig_worker" | "student" | "contractor";

export type TrustBand = "Strong" | "Moderate" | "Weak" | "Unknown";
export type ConfidenceBand = "High" | "Medium" | "Low";
export type RecommendationState =
  | "Recommended for manual approval path"
  | "Needs manual review"
  | "Insufficient data"
  | "Potential inconsistency detected";
export type VerificationState = "verified" | "user_provided" | "missing";
export type ConsentStatus = "active" | "revoked";
export type ReviewDisposition =
  | "Proceed to manual approval review"
  | "Needs more information"
  | "Continue manual review";
export type ReviewerRole = "applicant" | "reviewer" | "system";

export type EvidenceCategory =
  | "identity"
  | "payments"
  | "income"
  | "housing"
  | "references"
  | "recency";

export interface ConsentGrant {
  id: string;
  source:
    | "identity_check"
    | "bank_connection"
    | "income_docs"
    | "housing_docs"
    | "report_share";
  label: string;
  purpose: string;
  retentionDays: number;
  grantedAt: string;
  expiresAt: string;
  shareScope: string;
  status: ConsentStatus;
}

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  label: string;
  source: string;
  verification: VerificationState;
  detail: string;
  verifiedAt?: string;
  expiresAt?: string;
  shareIncluded: boolean;
}

export interface VerificationResult {
  identityVerified: boolean;
  accountOwnerMatch: boolean;
  documentConsistency: boolean;
  contradictions: string[];
}

export interface TrustCategory {
  key:
    | "payment_consistency"
    | "income_regularity"
    | "housing_history"
    | "balance_stability"
    | "identity_confidence"
    | "data_completeness";
  title: string;
  weight: number;
  score: number | null;
  band: TrustBand;
  rationale: string;
  drivers: string[];
  flags: string[];
}

export interface ReviewAction {
  reviewerName: string;
  disposition: ReviewDisposition;
  notes: string;
  createdAt: string;
}

export interface DisputeCase {
  id: string;
  field: string;
  explanation: string;
  status: "open" | "under_review";
  createdAt: string;
}

export interface AccessLog {
  id: string;
  actor: ReviewerRole;
  action: string;
  detail: string;
  at: string;
}

export interface ProfileSummary {
  id: string;
  applicantName: string;
  applicantEmail: string;
  persona?: PersonaKey;
  personaLabel: string;
  targetRent: number;
  generatedAt: string;
  validUntil: string;
  overallScore: number | null;
  confidence: ConfidenceBand;
  recommendation: RecommendationState;
  narrative: string;
  topDrivers: string[];
  missingEvidence: string[];
  riskFlags: string[];
  categories: TrustCategory[];
  evidence: EvidenceItem[];
  consent: ConsentGrant[];
  verification: VerificationResult;
  reviewerAction?: ReviewAction;
  disputes: DisputeCase[];
  accessLogs: AccessLog[];
}

export interface ApplicantInput {
  applicantName: string;
  applicantEmail: string;
  persona?: PersonaKey;
  targetRent: number;
  monthlyIncome: number;
  averageCushion: number;
  incomeRegularity: number;
  rentPaymentStreakMonths: number;
  utilityPaymentStreakMonths: number;
  residencyMonths: number;
  overdraftsLast90Days: number;
  signalRecencyDays: number;
  identityVerified: boolean;
  accountOwnerMatch: boolean;
  bankConnected: boolean;
  payStubUploaded: boolean;
  landlordReference: boolean;
  contradictionDetected: boolean;
  housingDocumentNames: string[];
  incomeDocumentNames: string[];
  consentSources: Array<ConsentGrant["source"]>;
  notes: string;
}

export interface ScenarioPreset {
  key: PersonaKey;
  label: string;
  summary: string;
  defaultInput: ApplicantInput;
}
