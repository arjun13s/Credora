import type { ApplicantInput, ScenarioPreset } from "@/lib/types";

const baseInput: ApplicantInput = {
  applicantName: "Jordan Rivera",
  applicantEmail: "jordan@example.com",
  persona: "newcomer",
  targetRent: 1850,
  monthlyIncome: 5400,
  averageCushion: 2900,
  incomeRegularity: 88,
  rentPaymentStreakMonths: 11,
  utilityPaymentStreakMonths: 8,
  residencyMonths: 14,
  overdraftsLast90Days: 0,
  signalRecencyDays: 18,
  identityVerified: true,
  accountOwnerMatch: true,
  bankConnected: true,
  payStubUploaded: true,
  landlordReference: true,
  contradictionDetected: false,
  housingDocumentNames: ["rent-ledger-march.pdf", "lease-renewal.pdf"],
  incomeDocumentNames: ["paystub-february.pdf"],
  consentSources: [
    "identity_check",
    "bank_connection",
    "income_docs",
    "housing_docs",
    "report_share",
  ],
  notes:
    "Newcomer applicant with stable deposits, documented rent history, and a landlord reference.",
};

export const scenarioPresets: ScenarioPreset[] = [
  {
    key: "newcomer",
    label: "Newcomer with steady payments",
    summary:
      "Strong rent proof and consistent deposits despite limited traditional credit visibility.",
    defaultInput: baseInput,
  },
  {
    key: "gig_worker",
    label: "Gig worker with variable income",
    summary:
      "Income moves around month to month, but housing payments remain consistent and documented.",
    defaultInput: {
      ...baseInput,
      applicantName: "Samira Patel",
      applicantEmail: "samira@example.com",
      persona: "gig_worker",
      targetRent: 1650,
      monthlyIncome: 4700,
      averageCushion: 1800,
      incomeRegularity: 62,
      rentPaymentStreakMonths: 9,
      utilityPaymentStreakMonths: 6,
      residencyMonths: 12,
      overdraftsLast90Days: 1,
      housingDocumentNames: ["rent-receipts-q1.pdf"],
      incomeDocumentNames: ["platform-payout-summary.pdf"],
      landlordReference: false,
      notes:
        "Gig worker applicant with variable deposits but no recent missed housing payments.",
    },
  },
  {
    key: "student",
    label: "Student with thin file",
    summary:
      "Very limited payment history, some verified income support, and clear need for manual review.",
    defaultInput: {
      ...baseInput,
      applicantName: "Maya Chen",
      applicantEmail: "maya@example.com",
      persona: "student",
      targetRent: 1300,
      monthlyIncome: 2450,
      averageCushion: 1100,
      incomeRegularity: 58,
      rentPaymentStreakMonths: 3,
      utilityPaymentStreakMonths: 1,
      residencyMonths: 5,
      overdraftsLast90Days: 1,
      signalRecencyDays: 9,
      landlordReference: false,
      housingDocumentNames: ["roommate-ledger.pdf"],
      incomeDocumentNames: ["campus-job-letter.pdf"],
      notes:
        "Student applicant with partial evidence and limited history, but recent signals are positive.",
    },
  },
  {
    key: "contractor",
    label: "Contractor with an inconsistency flag",
    summary:
      "Useful for showing that Credora escalates to review instead of hiding data conflicts.",
    defaultInput: {
      ...baseInput,
      applicantName: "Luis Romero",
      applicantEmail: "luis@example.com",
      persona: "contractor",
      targetRent: 2100,
      monthlyIncome: 6000,
      averageCushion: 2400,
      incomeRegularity: 71,
      rentPaymentStreakMonths: 7,
      utilityPaymentStreakMonths: 4,
      residencyMonths: 10,
      overdraftsLast90Days: 2,
      accountOwnerMatch: false,
      contradictionDetected: true,
      housingDocumentNames: ["rent-receipts.pdf"],
      incomeDocumentNames: ["contract-summary.pdf", "bank-deposit-export.csv"],
      notes:
        "Contractor profile with a name mismatch between the uploaded identity and connected financial account.",
    },
  },
];

export function getPresetByKey(key: string): ScenarioPreset {
  return (
    scenarioPresets.find((preset) => preset.key === key) ?? scenarioPresets[0]
  );
}

export function getDefaultApplicantInput(): ApplicantInput {
  return { ...scenarioPresets[0].defaultInput };
}
