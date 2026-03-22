import type { ApplicantProfileInput, DemoScenario } from "@/lib/types";

const baseInput: ApplicantProfileInput = {
  useCase: "tenant_screening",
  personalInformation: {
    fullName: "Jordan Rivera",
    email: "jordan@example.com",
    phone: "(555) 410-2298",
    city: "Raleigh",
    state: "NC",
    targetRent: 1850,
    preferredMoveInDate: "2026-05-15",
  },
  identityVerification: {
    identityMethod: "government_id",
    identityVerified: true,
    governmentIdFileNames: ["north-carolina-id.pdf"],
    selfiePlanned: true,
    accountOwnerMatch: true,
  },
  employmentIncome: {
    employmentStatus: "full_time",
    employerName: "Triangle Health Systems",
    monthlyIncome: 5400,
    incomeType: "salary",
    payFrequency: "biweekly",
    payStubFileNames: ["paystub-february.pdf"],
    contractDocumentFileNames: [],
  },
  housingHistory: {
    currentRent: 1680,
    monthsAtResidence: 14,
    rentPaymentStreakMonths: 11,
    utilityPaymentStreakMonths: 8,
    leaseFileNames: ["lease-renewal.pdf"],
    rentLedgerFileNames: ["rent-ledger-q1.pdf"],
    receiptsFileNames: ["rent-receipt-march.pdf"],
    landlordReferenceName: "Ms. Owens",
  },
  financialStability: {
    bankConnected: true,
    averageBalanceCushion: 2900,
    overdraftsLast90Days: 0,
    recurringBillsTracked: true,
    signalRecencyDays: 18,
    contradictionDetected: false,
  },
  supportingDocuments: {
    additionalFileNames: ["utility-bill.pdf"],
    applicantNotes:
      "I recently relocated for work and want a profile that shows my housing payment consistency clearly.",
  },
  consents: {
    identity_check: true,
    bank_connection: true,
    income_docs: true,
    housing_docs: true,
    profile_share: true,
    consentToSubmit: true,
    retentionAcknowledged: true,
  },
};

export const demoScenarios: DemoScenario[] = [
  {
    key: "newcomer",
    label: "Newcomer with strong rent history",
    description:
      "Good for the primary demo. Strong housing records, stable income, and connected financial signals.",
    input: baseInput,
  },
  {
    key: "gig_worker",
    label: "Gig worker with uneven income",
    description:
      "Shows that variable income does not automatically translate to high risk when payments are still consistent.",
    input: {
      ...baseInput,
      personalInformation: {
        ...baseInput.personalInformation,
        fullName: "Samira Patel",
        email: "samira@example.com",
        targetRent: 1650,
      },
      employmentIncome: {
        employmentStatus: "gig_worker",
        employerName: "",
        monthlyIncome: 4700,
        incomeType: "gig",
        payFrequency: "irregular",
        payStubFileNames: [],
        contractDocumentFileNames: ["platform-payout-summary.pdf"],
      },
      housingHistory: {
        ...baseInput.housingHistory,
        currentRent: 1520,
        monthsAtResidence: 12,
        rentPaymentStreakMonths: 9,
        utilityPaymentStreakMonths: 6,
        rentLedgerFileNames: ["rent-receipts-q1.pdf"],
        receiptsFileNames: [],
        landlordReferenceName: "",
      },
      financialStability: {
        ...baseInput.financialStability,
        averageBalanceCushion: 1800,
        overdraftsLast90Days: 1,
      },
      supportingDocuments: {
        additionalFileNames: [],
        applicantNotes:
          "My income changes month to month, but I have kept my rent current and can share platform payout records.",
      },
    },
  },
  {
    key: "student",
    label: "Student with thin-file profile",
    description:
      "Shows low confidence and manual review rather than treating limited data like bad behavior.",
    input: {
      ...baseInput,
      personalInformation: {
        ...baseInput.personalInformation,
        fullName: "Maya Chen",
        email: "maya@example.com",
        targetRent: 1300,
      },
      employmentIncome: {
        employmentStatus: "student",
        employerName: "Campus Library",
        monthlyIncome: 2450,
        incomeType: "mixed",
        payFrequency: "monthly",
        payStubFileNames: ["campus-job-letter.pdf"],
        contractDocumentFileNames: [],
      },
      housingHistory: {
        ...baseInput.housingHistory,
        currentRent: 1100,
        monthsAtResidence: 5,
        rentPaymentStreakMonths: 3,
        utilityPaymentStreakMonths: 1,
        leaseFileNames: [],
        rentLedgerFileNames: ["roommate-ledger.pdf"],
        landlordReferenceName: "",
      },
      financialStability: {
        ...baseInput.financialStability,
        averageBalanceCushion: 1100,
        overdraftsLast90Days: 1,
        signalRecencyDays: 9,
      },
      supportingDocuments: {
        additionalFileNames: [],
        applicantNotes:
          "I have a short rental history, but I can provide recent employment and housing records.",
      },
    },
  },
  {
    key: "inconsistency",
    label: "Profile with inconsistency flag",
    description:
      "Useful for demonstrating that Credora escalates conflicts to manual review rather than pretending certainty.",
    input: {
      ...baseInput,
      personalInformation: {
        ...baseInput.personalInformation,
        fullName: "Luis Romero",
        email: "luis@example.com",
        targetRent: 2100,
      },
      identityVerification: {
        ...baseInput.identityVerification,
        accountOwnerMatch: false,
      },
      employmentIncome: {
        employmentStatus: "self_employed",
        employerName: "Romero Design Co.",
        monthlyIncome: 6000,
        incomeType: "contract",
        payFrequency: "irregular",
        payStubFileNames: [],
        contractDocumentFileNames: ["contract-summary.pdf", "bank-deposit-export.csv"],
      },
      housingHistory: {
        ...baseInput.housingHistory,
        currentRent: 1890,
        monthsAtResidence: 10,
        rentPaymentStreakMonths: 7,
        utilityPaymentStreakMonths: 4,
        rentLedgerFileNames: ["rent-receipts.pdf"],
        landlordReferenceName: "",
      },
      financialStability: {
        ...baseInput.financialStability,
        averageBalanceCushion: 2400,
        overdraftsLast90Days: 2,
        contradictionDetected: true,
      },
      supportingDocuments: {
        additionalFileNames: [],
        applicantNotes:
          "My profile includes contract income, but there may be a mismatch between identity and connected account ownership.",
      },
    },
  },
];

export function getDefaultApplicantProfileInput(): ApplicantProfileInput {
  return structuredClone(demoScenarios[0].input);
}

export function getDemoScenario(key: string): DemoScenario {
  return demoScenarios.find((scenario) => scenario.key === key) ?? demoScenarios[0];
}
