import type {
  ApplicantProfileInput,
  ConsentSource,
  EvidenceItem,
  EvidenceProvenance,
  NormalizedEvidenceBundle,
} from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildProvenance(
  kind: EvidenceProvenance["kind"],
  source: EvidenceProvenance["source"],
  consentSource: ConsentSource | undefined,
  confidence: number,
  note?: string,
): EvidenceProvenance {
  return {
    kind,
    source,
    consentSource,
    confidence: clamp(confidence, 0, 1),
    capturedAt: new Date().toISOString(),
    note,
  };
}

function consentedSources(input: ApplicantProfileInput) {
  const consents = input.consents;
  const allowed = new Set<ConsentSource>();

  if (consents.identity_check) {
    allowed.add("identity_check");
  }
  if (consents.bank_connection) {
    allowed.add("bank_connection");
  }
  if (consents.income_docs) {
    allowed.add("income_docs");
  }
  if (consents.housing_docs) {
    allowed.add("housing_docs");
  }

  return allowed;
}

export function normalizeApplicantInput(input: ApplicantProfileInput): ApplicantProfileInput {
  const allowed = consentedSources(input);

  return {
    ...input,
    identityVerification: {
      ...input.identityVerification,
      identityVerified: allowed.has("identity_check")
        ? input.identityVerification.identityVerified
        : false,
      accountOwnerMatch:
        allowed.has("identity_check") && allowed.has("bank_connection")
          ? input.identityVerification.accountOwnerMatch
          : false,
      governmentIdFileNames: allowed.has("identity_check")
        ? input.identityVerification.governmentIdFileNames
        : [],
    },
    employmentIncome: {
      ...input.employmentIncome,
      payStubFileNames: allowed.has("income_docs")
        ? input.employmentIncome.payStubFileNames
        : [],
      contractDocumentFileNames: allowed.has("income_docs")
        ? input.employmentIncome.contractDocumentFileNames
        : [],
    },
    housingHistory: {
      ...input.housingHistory,
      leaseFileNames: allowed.has("housing_docs") ? input.housingHistory.leaseFileNames : [],
      rentLedgerFileNames: allowed.has("housing_docs")
        ? input.housingHistory.rentLedgerFileNames
        : [],
      receiptsFileNames: allowed.has("housing_docs")
        ? input.housingHistory.receiptsFileNames
        : [],
    },
    financialStability: {
      ...input.financialStability,
      bankConnected: allowed.has("bank_connection")
        ? input.financialStability.bankConnected
        : false,
    },
  };
}

export function buildEvidenceItems(
  submissionId: string,
  input: ApplicantProfileInput,
): EvidenceItem[] {
  const created: EvidenceItem[] = [];
  const identity = input.identityVerification;
  const employment = input.employmentIncome;
  const housing = input.housingHistory;
  const financial = input.financialStability;

  created.push({
    id: crypto.randomUUID(),
    submissionId,
    category: "identity",
    sourceType: "identity_check",
    verificationState: identity.identityVerified ? "verified" : "missing",
    label: "Identity verification readiness",
    detail: identity.identityVerified
      ? `Identity method ${identity.identityMethod} is marked as verified.`
      : "Identity is self-described but not yet verified.",
    metadata: {
      identityMethod: identity.identityMethod || "missing",
      files: identity.governmentIdFileNames,
    },
    shareIncluded: true,
  });

  created.push({
    id: crypto.randomUUID(),
    submissionId,
    category: "income",
    sourceType: employment.payStubFileNames.length > 0 ? "income_docs" : "self_report",
    verificationState:
      employment.payStubFileNames.length > 0 || employment.contractDocumentFileNames.length > 0
        ? "verified"
        : "self_reported",
    label: "Employment and income context",
    detail: `${employment.employmentStatus || "Unknown"} income reported at $${employment.monthlyIncome}/month.`,
    metadata: {
      employerName: employment.employerName || "Not provided",
      payFrequency: employment.payFrequency || "unknown",
      payStubFiles: employment.payStubFileNames,
      contractFiles: employment.contractDocumentFileNames,
    },
    shareIncluded: true,
  });

  created.push({
    id: crypto.randomUUID(),
    submissionId,
    category: "housing",
    sourceType:
      housing.leaseFileNames.length > 0 ||
      housing.rentLedgerFileNames.length > 0 ||
      housing.receiptsFileNames.length > 0
        ? "housing_docs"
        : "self_report",
    verificationState:
      housing.leaseFileNames.length > 0 ||
      housing.rentLedgerFileNames.length > 0 ||
      housing.receiptsFileNames.length > 0
        ? "verified"
        : "self_reported",
    label: "Housing history",
    detail: `${housing.monthsAtResidence} month(s) at current residence with ${housing.rentPaymentStreakMonths} month(s) of stated rent continuity.`,
    metadata: {
      leaseFiles: housing.leaseFileNames,
      ledgerFiles: housing.rentLedgerFileNames,
      receiptFiles: housing.receiptsFileNames,
      landlordReferenceName: housing.landlordReferenceName || "Not provided",
    },
    shareIncluded: true,
  });

  created.push({
    id: crypto.randomUUID(),
    submissionId,
    category: "payments",
    sourceType: financial.bankConnected ? "bank_connection" : "self_report",
    verificationState: financial.bankConnected ? "verified" : "self_reported",
    label: "Payment and cash-flow signals",
    detail: financial.bankConnected
      ? "Bank-linked cash-flow signals are available in sandbox mode."
      : "No bank-linked payment data was shared, so continuity depends on uploaded or self-reported records.",
    metadata: {
      averageBalanceCushion: financial.averageBalanceCushion,
      overdraftsLast90Days: financial.overdraftsLast90Days,
      recurringBillsTracked: financial.recurringBillsTracked,
    },
    shareIncluded: true,
  });

  created.push({
    id: crypto.randomUUID(),
    submissionId,
    category: "financial_stability",
    sourceType: financial.bankConnected ? "bank_connection" : "system",
    verificationState: financial.bankConnected ? "verified" : "missing",
    label: "Financial stability inputs",
    detail: financial.bankConnected
      ? "Balance cushion and overdraft disclosures were available from the bank-connected flow."
      : "No bank-connected stability signal was shared.",
    metadata: {
      averageBalanceCushion: financial.averageBalanceCushion,
      overdraftsLast90Days: financial.overdraftsLast90Days,
      signalRecencyDays: financial.signalRecencyDays,
    },
    shareIncluded: true,
  });

  created.push({
    id: crypto.randomUUID(),
    submissionId,
    category: "employment",
    sourceType:
      employment.payStubFileNames.length > 0 || employment.contractDocumentFileNames.length > 0
        ? "income_docs"
        : "self_report",
    verificationState:
      employment.payStubFileNames.length > 0 || employment.contractDocumentFileNames.length > 0
        ? "verified"
        : "self_reported",
    label: "Employment history context",
    detail: employment.employerName
      ? `Employment is described with ${employment.employerName}.`
      : "Employment context is self-reported without named employer evidence.",
    metadata: {
      employerName: employment.employerName || "Not provided",
      incomeType: employment.incomeType || "unknown",
    },
    shareIncluded: true,
  });

  created.push({
    id: crypto.randomUUID(),
    submissionId,
    category: "completeness",
    sourceType: "system",
    verificationState: "verified",
    label: "Completeness and recency",
    detail: `Most recent submitted evidence is ${financial.signalRecencyDays} day(s) old.`,
    metadata: {
      signalRecencyDays: financial.signalRecencyDays,
      additionalFiles: input.supportingDocuments.additionalFileNames,
    },
    shareIncluded: true,
  });

  if (financial.contradictionDetected || !identity.accountOwnerMatch) {
    created.push({
      id: crypto.randomUUID(),
      submissionId,
      category: "inconsistency",
      sourceType: "system",
      verificationState: "verified",
      label: "Potential inconsistency flags",
      detail: !identity.accountOwnerMatch
        ? "A mismatch exists between the applicant identity and connected account ownership."
        : "The applicant disclosed a contradiction requiring manual review.",
      metadata: {
        contradictionDetected: financial.contradictionDetected,
        accountOwnerMatch: identity.accountOwnerMatch,
      },
      shareIncluded: true,
    });
  }

  return created;
}

export function buildNormalizedEvidenceBundle(
  profileId: string,
  submissionId: string,
  input: ApplicantProfileInput,
): NormalizedEvidenceBundle {
  const identityDocumentCount = input.identityVerification.governmentIdFileNames.length;
  const incomeDocumentCount =
    input.employmentIncome.payStubFileNames.length +
    input.employmentIncome.contractDocumentFileNames.length;
  const housingDocumentCount =
    input.housingHistory.leaseFileNames.length +
    input.housingHistory.rentLedgerFileNames.length +
    input.housingHistory.receiptsFileNames.length;
  const identityVerified = input.identityVerification.identityVerified && identityDocumentCount > 0;
  const incomeVerified = incomeDocumentCount > 0;
  const housingVerified = housingDocumentCount > 0;
  const bankVerified = input.financialStability.bankConnected;
  const incomeCoverageRatio =
    input.personalInformation.targetRent > 0
      ? input.employmentIncome.monthlyIncome / input.personalInformation.targetRent
      : null;

  const requiredFieldCodesPresent = [
    input.personalInformation.fullName.trim() ? "personal.full_name" : "",
    input.personalInformation.email.trim() ? "personal.email" : "",
    input.personalInformation.phone.trim() ? "personal.phone" : "",
    input.personalInformation.city.trim() ? "personal.city" : "",
    input.personalInformation.state.trim() ? "personal.state" : "",
    input.personalInformation.targetRent > 0 ? "personal.target_rent" : "",
    input.identityVerification.identityMethod ? "identity.method" : "",
    input.employmentIncome.employmentStatus ? "income.employment_status" : "",
    input.employmentIncome.incomeType ? "income.income_type" : "",
    input.employmentIncome.monthlyIncome > 0 ? "income.monthly_income" : "",
    input.housingHistory.currentRent > 0 ? "housing.current_rent" : "",
    input.housingHistory.monthsAtResidence > 0 ? "housing.months_at_residence" : "",
  ].filter(Boolean);

  const allRequiredFieldCodes = [
    "personal.full_name",
    "personal.email",
    "personal.phone",
    "personal.city",
    "personal.state",
    "personal.target_rent",
    "identity.method",
    "income.employment_status",
    "income.income_type",
    "income.monthly_income",
    "housing.current_rent",
    "housing.months_at_residence",
  ];

  const optionalSignalCodesPresent = [
    identityDocumentCount > 0 ? "identity.document_uploaded" : "",
    incomeDocumentCount > 0 ? "income.document_uploaded" : "",
    housingDocumentCount > 0 ? "housing.document_uploaded" : "",
    bankVerified ? "payments.bank_connected" : "",
    input.housingHistory.landlordReferenceName.trim() ? "housing.landlord_reference" : "",
    input.financialStability.recurringBillsTracked ? "payments.recurring_bills" : "",
  ].filter(Boolean);

  const flags: string[] = [];
  if (!input.identityVerification.accountOwnerMatch) {
    flags.push("account_owner_mismatch");
  }
  if (input.financialStability.contradictionDetected) {
    flags.push("applicant_disclosed_contradiction");
  }

  const bundle: NormalizedEvidenceBundle = {
    schemaVersion: "credora.evidence.v1",
    profileId,
    submissionId,
    useCase: input.useCase,
    generatedAt: new Date().toISOString(),
    applicantContext: {
      city: input.personalInformation.city,
      state: input.personalInformation.state,
      targetRent: input.personalInformation.targetRent,
      currentRent: input.housingHistory.currentRent,
    },
    identity: {
      method: input.identityVerification.identityMethod,
      identityVerified,
      accountOwnerMatch: input.identityVerification.accountOwnerMatch,
      governmentIdDocumentCount: identityDocumentCount,
      provenance: buildProvenance(
        identityVerified ? "verified" : "self_reported",
        identityVerified ? "uploaded_document" : "applicant_form",
        "identity_check",
        identityVerified ? 0.92 : 0.36,
      ),
    },
    income: {
      employmentStatus: input.employmentIncome.employmentStatus,
      incomeType: input.employmentIncome.incomeType,
      payFrequency: input.employmentIncome.payFrequency,
      monthlyIncome: input.employmentIncome.monthlyIncome,
      incomeCoverageRatio,
      payStubDocumentCount: input.employmentIncome.payStubFileNames.length,
      contractDocumentCount: input.employmentIncome.contractDocumentFileNames.length,
      employerNameProvided: Boolean(input.employmentIncome.employerName.trim()),
      provenance: buildProvenance(
        incomeVerified ? "verified" : "self_reported",
        incomeVerified ? "uploaded_document" : "applicant_form",
        incomeVerified ? "income_docs" : undefined,
        incomeVerified ? 0.86 : 0.42,
      ),
    },
    housing: {
      currentRent: input.housingHistory.currentRent,
      monthsAtResidence: input.housingHistory.monthsAtResidence,
      rentPaymentStreakMonths: input.housingHistory.rentPaymentStreakMonths,
      utilityPaymentStreakMonths: input.housingHistory.utilityPaymentStreakMonths,
      leasePresent: input.housingHistory.leaseFileNames.length > 0,
      rentLedgerPresent: input.housingHistory.rentLedgerFileNames.length > 0,
      receiptsPresent: input.housingHistory.receiptsFileNames.length > 0,
      landlordReferencePresent: Boolean(input.housingHistory.landlordReferenceName.trim()),
      provenance: buildProvenance(
        housingVerified ? "verified" : "self_reported",
        housingVerified ? "uploaded_document" : "applicant_form",
        housingVerified ? "housing_docs" : undefined,
        housingVerified ? 0.89 : 0.4,
      ),
    },
    payments: {
      bankConnected: input.financialStability.bankConnected,
      averageBalanceCushion: input.financialStability.averageBalanceCushion,
      overdraftsLast90Days: input.financialStability.overdraftsLast90Days,
      recurringBillsTracked: input.financialStability.recurringBillsTracked,
      signalRecencyDays: input.financialStability.signalRecencyDays,
      provenance: buildProvenance(
        bankVerified ? "verified" : "self_reported",
        bankVerified ? "bank_connection" : "applicant_form",
        bankVerified ? "bank_connection" : undefined,
        bankVerified ? 0.93 : 0.34,
      ),
    },
    employment: {
      employerNameProvided: Boolean(input.employmentIncome.employerName.trim()),
      contractPresent: input.employmentIncome.contractDocumentFileNames.length > 0,
      payStubPresent: input.employmentIncome.payStubFileNames.length > 0,
      provenance: buildProvenance(
        incomeVerified ? "verified" : "self_reported",
        incomeVerified ? "uploaded_document" : "applicant_form",
        incomeVerified ? "income_docs" : undefined,
        incomeVerified ? 0.84 : 0.38,
      ),
    },
    completeness: {
      requiredFieldCodesPresent,
      missingFieldCodes: allRequiredFieldCodes.filter(
        (fieldCode) => !requiredFieldCodesPresent.includes(fieldCode),
      ),
      optionalSignalCodesPresent,
      staleSignalCodes:
        input.financialStability.signalRecencyDays > 45 ? ["payments.signal_recency"] : [],
      signalRecencyDays: input.financialStability.signalRecencyDays,
      provenance: buildProvenance(
        "derived",
        "system_rule",
        undefined,
        0.95,
        "Derived from the structured applicant submission after consent filtering.",
      ),
    },
    inconsistencies: {
      contradictionDetected: flags.length > 0,
      flags,
      severity:
        flags.length === 0
          ? "none"
          : flags.length === 1
            ? "medium"
            : "high",
      provenance: buildProvenance(
        "derived",
        "system_rule",
        undefined,
        0.95,
        "Derived only from explicit mismatches or applicant-disclosed contradictions.",
      ),
    },
    summary: {
      verifiedCount: [identityVerified, incomeVerified, housingVerified, bankVerified].filter(Boolean)
        .length,
      selfReportedCount: [identityVerified, incomeVerified, housingVerified, bankVerified].filter(
        (value) => !value,
      ).length,
      derivedCount: 2,
      missingCount:
        [identityVerified, incomeVerified, housingVerified, bankVerified].filter((value) => !value)
          .length +
        (input.housingHistory.landlordReferenceName.trim() ? 0 : 1) +
        allRequiredFieldCodes.filter((fieldCode) => !requiredFieldCodesPresent.includes(fieldCode))
          .length,
    },
  };

  return bundle;
}
