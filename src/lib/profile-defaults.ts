import type { ApplicantProfileInput } from "@/lib/types";

export interface ApplicantProfileSectionChecks {
  personal: boolean[];
  identity: boolean[];
  income: boolean[];
  housing: boolean[];
  financial: boolean[];
  consent: boolean[];
}

export interface ApplicantProfileSectionCompleteness {
  personal: number;
  identity: number;
  income: number;
  housing: number;
  financial: number;
  consent: number;
}

export function createEmptyApplicantProfileInput(): ApplicantProfileInput {
  return {
    useCase: "tenant_screening",
    personalInformation: {
      fullName: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      targetRent: 0,
    },
    identityVerification: {
      identityMethod: "",
      identityVerified: false,
      governmentIdFileNames: [],
      accountOwnerMatch: false,
    },
    employmentIncome: {
      employmentStatus: "",
      employerName: "",
      monthlyIncome: 0,
      incomeType: "",
      payFrequency: "",
      payStubFileNames: [],
      contractDocumentFileNames: [],
    },
    housingHistory: {
      currentRent: 0,
      monthsAtResidence: 0,
      rentPaymentStreakMonths: 0,
      utilityPaymentStreakMonths: 0,
      leaseFileNames: [],
      rentLedgerFileNames: [],
      receiptsFileNames: [],
      landlordReferenceName: "",
    },
    financialStability: {
      bankConnected: false,
      averageBalanceCushion: 0,
      overdraftsLast90Days: 0,
      recurringBillsTracked: false,
      signalRecencyDays: 0,
      contradictionDetected: false,
    },
    supportingDocuments: {
      additionalFileNames: [],
    },
    consents: {
    identity_check: false,
    bank_connection: false,
    income_docs: false,
    housing_docs: false,
    consentToSubmit: false,
    retentionAcknowledged: false,
  },
  };
}

function percentage(checks: boolean[]): number {
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function getApplicantProfileSectionChecks(
  input: ApplicantProfileInput,
): ApplicantProfileSectionChecks {
  const hasIncomeDocs =
    input.employmentIncome.payStubFileNames.length > 0 ||
    input.employmentIncome.contractDocumentFileNames.length > 0;
  const hasHousingDocs =
    input.housingHistory.leaseFileNames.length > 0 ||
    input.housingHistory.rentLedgerFileNames.length > 0 ||
    input.housingHistory.receiptsFileNames.length > 0;

  return {
    personal: [
      Boolean(input.personalInformation.fullName.trim()),
      Boolean(input.personalInformation.email.trim()),
      Boolean(input.personalInformation.phone.trim()),
      Boolean(input.personalInformation.city.trim()),
      Boolean(input.personalInformation.state.trim()),
      input.personalInformation.targetRent > 0,
    ],
    identity: [
      Boolean(input.identityVerification.identityMethod),
      input.identityVerification.governmentIdFileNames.length > 0,
    ],
    income: [
      Boolean(input.employmentIncome.employmentStatus),
      Boolean(input.employmentIncome.employerName.trim()),
      input.employmentIncome.monthlyIncome > 0,
      Boolean(input.employmentIncome.incomeType),
      Boolean(input.employmentIncome.payFrequency),
      hasIncomeDocs,
    ],
    housing: [
      input.housingHistory.currentRent > 0,
      input.housingHistory.monthsAtResidence > 0,
      input.housingHistory.rentPaymentStreakMonths > 0,
      input.housingHistory.utilityPaymentStreakMonths > 0,
      hasHousingDocs,
      Boolean(input.housingHistory.landlordReferenceName.trim()),
    ],
    financial: [
      input.financialStability.bankConnected,
      input.financialStability.bankConnected &&
        input.financialStability.averageBalanceCushion > 0,
      input.financialStability.bankConnected &&
        input.financialStability.signalRecencyDays > 0,
      input.financialStability.bankConnected,
    ],
    consent: [
      input.consents.identity_check,
      input.consents.bank_connection,
      input.consents.income_docs,
      input.consents.housing_docs,
      input.consents.consentToSubmit,
      input.consents.retentionAcknowledged,
    ],
  };
}

export function getApplicantProfileSectionCompleteness(
  input: ApplicantProfileInput,
): ApplicantProfileSectionCompleteness {
  const checks = getApplicantProfileSectionChecks(input);

  return {
    personal: percentage(checks.personal),
    identity: percentage(checks.identity),
    income: percentage(checks.income),
    housing: percentage(checks.housing),
    financial: percentage(checks.financial),
    consent: percentage(checks.consent),
  };
}

export function isApplicantProfileSubmitReady(
  input: ApplicantProfileInput,
): boolean {
  const checks = getApplicantProfileSectionChecks(input);
  return Object.values(checks).every((sectionChecks) =>
    sectionChecks.every(Boolean),
  );
}

export function calculateCompletionPercent(input: ApplicantProfileInput): number {
  const checks = Object.values(getApplicantProfileSectionChecks(input)).flat();

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
