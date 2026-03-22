import type { ApplicantProfileInput } from "@/lib/types";
import type { RecursivePartial } from "@/lib/api-contracts";
import { getApplicantProfileSectionChecks } from "@/lib/profile-defaults";

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validateApplicantProfileInput(
  input: ApplicantProfileInput,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const personal = input.personalInformation;
  const employment = input.employmentIncome;
  const housing = input.housingHistory;
  const consents = input.consents;
  const checks = getApplicantProfileSectionChecks(input);

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

  if (!checks.identity[0]) {
    issues.push({
      field: "identityVerification.identityMethod",
      message: "Choose at least one identity verification method.",
    });
  }

  if (!checks.identity[1]) {
    issues.push({
      field: "identityVerification.governmentIdFileNames",
      message: "Upload at least one identity document image or file.",
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

  if (!employment.employerName.trim()) {
    issues.push({
      field: "employmentIncome.employerName",
      message: "Employer or platform name is required.",
    });
  }

  if (!employment.payFrequency) {
    issues.push({
      field: "employmentIncome.payFrequency",
      message: "Pay frequency is required.",
    });
  }

  if (!checks.income[5]) {
    issues.push({
      field: "employmentIncome.payStubFileNames",
      message: "Upload at least one income-supporting document.",
    });
  }

  if (housing.currentRent <= 0) {
    issues.push({
      field: "housingHistory.currentRent",
      message: "Current rent must be greater than zero.",
    });
  }

  if (housing.monthsAtResidence <= 0) {
    issues.push({
      field: "housingHistory.monthsAtResidence",
      message: "Months at current residence must be greater than zero.",
    });
  }

  if (housing.rentPaymentStreakMonths <= 0) {
    issues.push({
      field: "housingHistory.rentPaymentStreakMonths",
      message: "Rent continuity must be greater than zero months.",
    });
  }

  if (housing.utilityPaymentStreakMonths <= 0) {
    issues.push({
      field: "housingHistory.utilityPaymentStreakMonths",
      message: "Utility continuity must be greater than zero months.",
    });
  }

  if (!checks.housing[4]) {
    issues.push({
      field: "housingHistory.leaseFileNames",
      message: "Upload at least one housing document.",
    });
  }

  if (!housing.landlordReferenceName.trim()) {
    issues.push({
      field: "housingHistory.landlordReferenceName",
      message: "Landlord reference name is required.",
    });
  }

  if (!checks.financial[0]) {
    issues.push({
      field: "financialStability.bankConnected",
      message: "Connect a bank account before submitting.",
    });
  }

  if (!checks.financial[1]) {
    issues.push({
      field: "financialStability.averageBalanceCushion",
      message: "Average balance cushion must be greater than zero.",
    });
  }

  if (!checks.financial[2]) {
    issues.push({
      field: "financialStability.signalRecencyDays",
      message: "Most recent signal age must be greater than zero.",
    });
  }

  if (!checks.consent[0] || !checks.consent[1] || !checks.consent[2] || !checks.consent[3]) {
    issues.push({
      field: "consents",
      message: "All required evidence consents must be enabled.",
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
    typeof candidate.consents?.consentToSubmit === "boolean" &&
    typeof candidate.consents?.retentionAcknowledged === "boolean"
  );
}

export function isApplicantProfilePatch(
  value: unknown,
): value is RecursivePartial<ApplicantProfileInput> {
  return Boolean(value) && typeof value === "object";
}
