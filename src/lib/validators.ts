import type { ApplicantProfileInput } from "@/lib/types";
import type { RecursivePartial } from "@/lib/api-contracts";

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validateApplicantProfileInput(
  input: ApplicantProfileInput,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const personal = input.personalInformation;
  const identity = input.identityVerification;
  const employment = input.employmentIncome;
  const housing = input.housingHistory;
  const consents = input.consents;

  if (!personal.fullName.trim()) {
    issues.push({ field: "personalInformation.fullName", message: "Full name is required." });
  }

  if (!personal.email.trim()) {
    issues.push({ field: "personalInformation.email", message: "Email is required." });
  }

  if (!personal.phone.trim()) {
    issues.push({ field: "personalInformation.phone", message: "Phone number is required." });
  }

  if (!personal.city.trim()) {
    issues.push({ field: "personalInformation.city", message: "City is required." });
  }

  if (!personal.state.trim()) {
    issues.push({ field: "personalInformation.state", message: "State is required." });
  }

  if (personal.targetRent <= 0) {
    issues.push({ field: "personalInformation.targetRent", message: "Target rent must be greater than zero." });
  }

  if (!identity.identityMethod) {
    issues.push({
      field: "identityVerification.identityMethod",
      message: "Choose at least one identity verification method.",
    });
  }

  if (!employment.employmentStatus) {
    issues.push({
      field: "employmentIncome.employmentStatus",
      message: "Employment status is required.",
    });
  }

  if (!employment.incomeType) {
    issues.push({
      field: "employmentIncome.incomeType",
      message: "Income type is required.",
    });
  }

  if (employment.monthlyIncome <= 0) {
    issues.push({
      field: "employmentIncome.monthlyIncome",
      message: "Monthly income must be greater than zero.",
    });
  }

  if (housing.currentRent <= 0) {
    issues.push({
      field: "housingHistory.currentRent",
      message: "Current rent must be greater than zero.",
    });
  }

  if (!consents.consentToSubmit) {
    issues.push({
      field: "consents.consentToSubmit",
      message: "Submission consent is required.",
    });
  }

  if (!consents.retentionAcknowledged) {
    issues.push({
      field: "consents.retentionAcknowledged",
      message: "Retention acknowledgement is required.",
    });
  }

  if (!consents.profile_share) {
    issues.push({
      field: "consents.profile_share",
      message: "Profile sharing consent is required to generate a shareable housing profile.",
    });
  }

  return issues;
}

export function isApplicantProfileInput(
  value: unknown,
): value is ApplicantProfileInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ApplicantProfileInput;
  return (
    typeof candidate.useCase === "string" &&
    typeof candidate.personalInformation?.fullName === "string" &&
    typeof candidate.personalInformation?.email === "string" &&
    typeof candidate.personalInformation?.phone === "string" &&
    typeof candidate.personalInformation?.city === "string" &&
    typeof candidate.personalInformation?.state === "string" &&
    typeof candidate.personalInformation?.targetRent === "number" &&
    typeof candidate.identityVerification?.identityMethod === "string" &&
    typeof candidate.identityVerification?.identityVerified === "boolean" &&
    Array.isArray(candidate.identityVerification?.governmentIdFileNames) &&
    typeof candidate.identityVerification?.accountOwnerMatch === "boolean" &&
    typeof candidate.employmentIncome?.monthlyIncome === "number" &&
    Array.isArray(candidate.employmentIncome?.payStubFileNames) &&
    Array.isArray(candidate.employmentIncome?.contractDocumentFileNames) &&
    typeof candidate.housingHistory?.currentRent === "number" &&
    typeof candidate.housingHistory?.monthsAtResidence === "number" &&
    Array.isArray(candidate.housingHistory?.leaseFileNames) &&
    Array.isArray(candidate.housingHistory?.rentLedgerFileNames) &&
    Array.isArray(candidate.housingHistory?.receiptsFileNames) &&
    typeof candidate.financialStability?.bankConnected === "boolean" &&
    typeof candidate.financialStability?.averageBalanceCushion === "number" &&
    typeof candidate.financialStability?.overdraftsLast90Days === "number" &&
    typeof candidate.financialStability?.signalRecencyDays === "number" &&
    Array.isArray(candidate.supportingDocuments?.additionalFileNames) &&
    typeof candidate.supportingDocuments?.applicantNotes === "string" &&
    typeof candidate.consents?.consentToSubmit === "boolean" &&
    typeof candidate.consents?.retentionAcknowledged === "boolean"
  );
}

export function isApplicantProfilePatch(
  value: unknown,
): value is RecursivePartial<ApplicantProfileInput> {
  return Boolean(value) && typeof value === "object";
}
