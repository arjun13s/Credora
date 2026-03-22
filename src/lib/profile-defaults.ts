import type { ApplicantProfileInput } from "@/lib/types";

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
      dateOfBirth: "",
      preferredMoveInDate: "",
    },
    identityVerification: {
      identityMethod: "",
      identityVerified: false,
      governmentIdFileNames: [],
      selfiePlanned: false,
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
      applicantNotes: "",
    },
    consents: {
      identity_check: false,
      bank_connection: false,
      income_docs: false,
      housing_docs: false,
      profile_share: false,
      consentToSubmit: false,
      retentionAcknowledged: false,
    },
  };
}

export function calculateCompletionPercent(input: ApplicantProfileInput): number {
  const checks = [
    Boolean(input.personalInformation.fullName.trim()),
    Boolean(input.personalInformation.email.trim()),
    Boolean(input.personalInformation.phone.trim()),
    Boolean(input.personalInformation.city.trim()),
    Boolean(input.personalInformation.state.trim()),
    input.personalInformation.targetRent > 0,
    Boolean(input.identityVerification.identityMethod),
    Boolean(input.employmentIncome.employmentStatus),
    Boolean(input.employmentIncome.incomeType),
    input.employmentIncome.monthlyIncome > 0,
    input.housingHistory.currentRent > 0,
    input.housingHistory.monthsAtResidence > 0,
    input.consents.consentToSubmit,
    input.consents.retentionAcknowledged,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
