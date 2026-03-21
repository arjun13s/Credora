import { getPresetByKey } from "@/lib/demo-scenarios";
import type {
  AccessLog,
  ApplicantInput,
  ConfidenceBand,
  ConsentGrant,
  EvidenceItem,
  ProfileSummary,
  RecommendationState,
  ScenarioPreset,
  TrustBand,
  TrustCategory,
  VerificationResult,
} from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString();
}

function bandFromScore(score: number | null): TrustBand {
  if (score === null) {
    return "Unknown";
  }

  if (score >= 78) {
    return "Strong";
  }

  if (score >= 55) {
    return "Moderate";
  }

  return "Weak";
}

function confidenceFromScore(value: number): ConfidenceBand {
  if (value >= 78) {
    return "High";
  }

  if (value >= 58) {
    return "Medium";
  }

  return "Low";
}

function createConsent(
  source: ConsentGrant["source"],
  nowIso: string,
): ConsentGrant {
  const metadata: Record<
    ConsentGrant["source"],
    Omit<ConsentGrant, "id" | "grantedAt" | "expiresAt" | "status">
  > = {
    identity_check: {
      source: "identity_check",
      label: "Identity verification",
      purpose: "Confirm the applicant is who they claim to be for rental screening.",
      retentionDays: 30,
      shareScope: "Applicant and named reviewer only",
    },
    bank_connection: {
      source: "bank_connection",
      label: "Connected banking signals",
      purpose: "Translate recurring deposit and payment behavior into rental-relevant evidence.",
      retentionDays: 45,
      shareScope: "Derived signals only, not raw transactions by default",
    },
    income_docs: {
      source: "income_docs",
      label: "Income documents",
      purpose: "Support deposit regularity and recent earnings context.",
      retentionDays: 45,
      shareScope: "Summary fields and filenames only",
    },
    housing_docs: {
      source: "housing_docs",
      label: "Housing history documents",
      purpose: "Verify residency and rent-related payment history.",
      retentionDays: 60,
      shareScope: "Evidence summaries and uploaded document labels",
    },
    report_share: {
      source: "report_share",
      label: "Share with landlord or reviewer",
      purpose: "Allow one decision-maker to review the generated housing profile.",
      retentionDays: 14,
      shareScope: "Single reviewer link with time-bound access",
    },
  };

  const config = metadata[source];

  return {
    ...config,
    id: crypto.randomUUID(),
    grantedAt: nowIso,
    expiresAt: addDays(new Date(nowIso), config.retentionDays),
    status: "active",
  };
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildVerification(input: ApplicantInput): VerificationResult {
  const contradictions = [];

  if (!input.identityVerified) {
    contradictions.push("No completed identity verification was provided.");
  }

  if (!input.accountOwnerMatch) {
    contradictions.push(
      "Connected financial account ownership does not fully match the provided identity record.",
    );
  }

  if (input.contradictionDetected) {
    contradictions.push(
      "Applicant-submitted evidence contains a conflict that requires manual review.",
    );
  }

  return {
    identityVerified: input.identityVerified,
    accountOwnerMatch: input.accountOwnerMatch,
    documentConsistency: !input.contradictionDetected,
    contradictions,
  };
}

function createEvidence(
  input: ApplicantInput,
  generatedAt: string,
): EvidenceItem[] {
  const evidence: EvidenceItem[] = [
    {
      id: crypto.randomUUID(),
      category: "identity",
      label: "Government ID verification",
      source: "Applicant upload",
      verification: input.identityVerified ? "verified" : "missing",
      detail: input.identityVerified
        ? "Identity check completed and matched to applicant profile."
        : "Identity was not fully verified in this profile.",
      verifiedAt: input.identityVerified ? generatedAt : undefined,
      expiresAt: input.identityVerified
        ? addDays(new Date(generatedAt), 30)
        : undefined,
      shareIncluded: true,
    },
    {
      id: crypto.randomUUID(),
      category: "payments",
      label: "Connected bank account signals",
      source: input.bankConnected ? "Open banking connection" : "Not connected",
      verification: input.bankConnected ? "verified" : "missing",
      detail: input.bankConnected
        ? `Recurring payment and balance signals were derived from the connected account. Average cushion ${currency(input.averageCushion)}.`
        : "No bank connection was provided, so payment consistency relies on uploaded records.",
      verifiedAt: input.bankConnected ? generatedAt : undefined,
      expiresAt: input.bankConnected
        ? addDays(new Date(generatedAt), 45)
        : undefined,
      shareIncluded: true,
    },
    {
      id: crypto.randomUUID(),
      category: "income",
      label: "Income support",
      source: input.payStubUploaded ? "Uploaded income documents" : "Applicant self-report",
      verification: input.payStubUploaded ? "verified" : "user_provided",
      detail: input.payStubUploaded
        ? `Income documents provided: ${input.incomeDocumentNames.join(", ")}.`
        : `Monthly income self-reported as ${currency(input.monthlyIncome)} with no uploaded support.`,
      verifiedAt: input.payStubUploaded ? generatedAt : undefined,
      expiresAt: input.payStubUploaded
        ? addDays(new Date(generatedAt), 45)
        : undefined,
      shareIncluded: true,
    },
    {
      id: crypto.randomUUID(),
      category: "housing",
      label: "Housing payment history",
      source:
        input.housingDocumentNames.length > 0
          ? "Uploaded housing documents"
          : "No housing files uploaded",
      verification:
        input.housingDocumentNames.length > 0 ? "verified" : "missing",
      detail:
        input.housingDocumentNames.length > 0
          ? `Housing files provided: ${input.housingDocumentNames.join(", ")}.`
          : "No rent ledger, lease, or housing receipt file was included.",
      verifiedAt:
        input.housingDocumentNames.length > 0 ? generatedAt : undefined,
      expiresAt:
        input.housingDocumentNames.length > 0
          ? addDays(new Date(generatedAt), 60)
          : undefined,
      shareIncluded: true,
    },
    {
      id: crypto.randomUUID(),
      category: "references",
      label: "Landlord reference",
      source: input.landlordReference ? "Manual reference" : "Not provided",
      verification: input.landlordReference ? "user_provided" : "missing",
      detail: input.landlordReference
        ? "Applicant indicated an optional landlord reference for follow-up."
        : "No landlord or caseworker reference was added.",
      shareIncluded: true,
    },
    {
      id: crypto.randomUUID(),
      category: "recency",
      label: "Signal recency",
      source: "Generated profile",
      verification: "verified",
      detail: `Most recent verified signal was ${input.signalRecencyDays} day(s) ago.`,
      verifiedAt: generatedAt,
      expiresAt: addDays(new Date(generatedAt), 14),
      shareIncluded: true,
    },
  ];

  return evidence;
}

function createCategories(input: ApplicantInput): TrustCategory[] {
  const paymentScore = input.bankConnected
    ? clamp(
        38 +
          input.rentPaymentStreakMonths * 4 +
          input.utilityPaymentStreakMonths * 1.5 -
          input.overdraftsLast90Days * 8,
        0,
        100,
      )
    : input.housingDocumentNames.length > 0
      ? clamp(44 + input.rentPaymentStreakMonths * 4, 0, 92)
      : null;

  const incomeCoverage = input.targetRent > 0 ? input.monthlyIncome / input.targetRent : 0;
  const incomeScore =
    input.bankConnected || input.payStubUploaded
      ? clamp(
          22 +
            input.incomeRegularity * 0.65 +
            (incomeCoverage >= 3 ? 18 : incomeCoverage >= 2 ? 10 : 4),
          0,
          100,
        )
      : null;

  const housingScore =
    input.housingDocumentNames.length > 0
      ? clamp(
          35 +
            input.rentPaymentStreakMonths * 4 +
            input.residencyMonths * 1.2 +
            (input.landlordReference ? 6 : 0),
          0,
          100,
        )
      : null;

  const balanceScore = input.bankConnected
    ? clamp(
        35 +
          (input.averageCushion / Math.max(input.targetRent, 1)) * 20 -
          input.overdraftsLast90Days * 10,
        0,
        100,
      )
    : null;

  const identityScore = input.identityVerified
    ? clamp(70 + (input.accountOwnerMatch ? 18 : -20), 0, 100)
    : null;

  const sourcesCount = [
    input.identityVerified,
    input.bankConnected,
    input.payStubUploaded,
    input.housingDocumentNames.length > 0,
    input.landlordReference,
  ].filter(Boolean).length;

  const dataCompletenessScore = clamp(
    28 +
      sourcesCount * 12 +
      (input.signalRecencyDays <= 21
        ? 12
        : input.signalRecencyDays <= 45
          ? 6
          : 0),
    0,
    100,
  );

  const categories: TrustCategory[] = [
    {
      key: "payment_consistency",
      title: "Payment consistency",
      weight: 30,
      score: paymentScore,
      band: bandFromScore(paymentScore),
      rationale:
        paymentScore === null
          ? "No connected account or documented payment history was supplied."
          : "Looks at recurring housing and bill payments while accounting for overdraft-related instability.",
      drivers:
        paymentScore === null
          ? ["No verified payment feed"]
          : [
              `${input.rentPaymentStreakMonths} month(s) of recent housing-payment continuity`,
              `${input.utilityPaymentStreakMonths} month(s) of recurring utility continuity`,
            ],
      flags:
        input.overdraftsLast90Days > 1
          ? [`${input.overdraftsLast90Days} recent overdraft event(s)`]
          : [],
    },
    {
      key: "income_regularity",
      title: "Income regularity",
      weight: 20,
      score: incomeScore,
      band: bandFromScore(incomeScore),
      rationale:
        incomeScore === null
          ? "No verified income signals were provided."
          : "Measures deposit cadence and supporting documents rather than making a decision on raw income alone.",
      drivers:
        incomeScore === null
          ? ["Income is self-reported only"]
          : [
              `Income regularity set to ${input.incomeRegularity}/100`,
              `Estimated monthly income ${currency(input.monthlyIncome)}`,
            ],
      flags: input.payStubUploaded ? [] : ["Income documentation is missing"],
    },
    {
      key: "housing_history",
      title: "Housing payment consistency",
      weight: 20,
      score: housingScore,
      band: bandFromScore(housingScore),
      rationale:
        housingScore === null
          ? "No housing ledger, lease, or receipt was provided."
          : "Centers rent history and residency evidence because those signals are more relevant to tenancy than a generic credit score.",
      drivers:
        housingScore === null
          ? ["No uploaded rent evidence"]
          : [
              `${input.housingDocumentNames.length} housing document(s) on file`,
              `${input.residencyMonths} month(s) of documented residency`,
            ],
      flags: input.landlordReference ? [] : ["No optional landlord reference"],
    },
    {
      key: "balance_stability",
      title: "Balance stability",
      weight: 15,
      score: balanceScore,
      band: bandFromScore(balanceScore),
      rationale:
        balanceScore === null
          ? "Balance stability cannot be assessed without connected transaction signals."
          : "Uses a modest balance cushion and volatility check without treating lower income as a moral failing.",
      drivers:
        balanceScore === null
          ? ["No bank-derived balance signal"]
          : [`Average account cushion ${currency(input.averageCushion)}`],
      flags:
        input.overdraftsLast90Days > 0
          ? [`${input.overdraftsLast90Days} overdraft event(s) in the last 90 days`]
          : [],
    },
    {
      key: "identity_confidence",
      title: "Identity confidence",
      weight: 10,
      score: identityScore,
      band: bandFromScore(identityScore),
      rationale:
        identityScore === null
          ? "Identity has not yet been verified."
          : "Checks whether applicant identity and connected financial ownership align.",
      drivers:
        identityScore === null
          ? ["Identity still pending"]
          : [
              input.identityVerified
                ? "Government ID verification completed"
                : "Identity unverified",
            ],
      flags: input.accountOwnerMatch ? [] : ["Name mismatch requires manual review"],
    },
    {
      key: "data_completeness",
      title: "Data completeness and recency",
      weight: 5,
      score: dataCompletenessScore,
      band: bandFromScore(dataCompletenessScore),
      rationale:
        "Lower completeness reduces confidence, not character, and signals when a human should review more context.",
      drivers: [
        `${sourcesCount} verified or supported source(s) included`,
        `Most recent signal ${input.signalRecencyDays} day(s) old`,
      ],
      flags:
        input.signalRecencyDays > 45
          ? ["Signals are becoming stale"]
          : [],
    },
  ];

  return categories;
}

function computeOverallScore(categories: TrustCategory[]) {
  const scored = categories.filter(
    (category): category is TrustCategory & { score: number } =>
      typeof category.score === "number",
  );

  if (scored.length === 0) {
    return null;
  }

  const weightedTotal = scored.reduce(
    (sum, category) => sum + category.score * category.weight,
    0,
  );
  const availableWeight = scored.reduce(
    (sum, category) => sum + category.weight,
    0,
  );

  return Math.round(weightedTotal / availableWeight);
}

function computeConfidence(input: ApplicantInput, verification: VerificationResult) {
  const verifiedSources = [
    input.identityVerified,
    input.bankConnected,
    input.payStubUploaded,
    input.housingDocumentNames.length > 0,
  ].filter(Boolean).length;

  const raw = clamp(
    24 +
      verifiedSources * 14 +
      (input.signalRecencyDays <= 21 ? 12 : input.signalRecencyDays <= 45 ? 6 : 0) -
      verification.contradictions.length * 18,
    0,
    100,
  );

  return confidenceFromScore(raw);
}

function buildNarrative(
  preset: ScenarioPreset,
  overallScore: number | null,
  confidence: ConfidenceBand,
  recommendation: RecommendationState,
  categories: TrustCategory[],
) {
  const strongest = [...categories]
    .filter((category) => category.band === "Strong")
    .slice(0, 2)
    .map((category) => category.title.toLowerCase());
  const weakest = categories.find((category) => category.band === "Weak");

  const lead =
    overallScore === null
      ? `${preset.label} profile has not assembled enough evidence for a meaningful reliability read yet.`
      : `${preset.label} profile generated an explainable reliability score of ${overallScore} with ${confidence.toLowerCase()} confidence.`;

  const strengths =
    strongest.length > 0
      ? `Verified strength areas include ${strongest.join(" and ")}.`
      : "The profile does not yet show a clearly strong verified category.";

  const caution = weakest
    ? `${weakest.title} is the main caution area, so the system keeps a human in the loop.`
    : "No category triggered an automatic caution flag beyond normal manual review expectations.";

  return `${lead} ${strengths} ${caution} Final state: ${recommendation}.`;
}

function buildRecommendation(
  input: ApplicantInput,
  verification: VerificationResult,
  overallScore: number | null,
  confidence: ConfidenceBand,
  categories: TrustCategory[],
): RecommendationState {
  if (verification.contradictions.length > 0) {
    return "Potential inconsistency detected";
  }

  if (overallScore === null || confidence === "Low") {
    return "Insufficient data";
  }

  const payment = categories.find(
    (category) => category.key === "payment_consistency",
  );
  const housing = categories.find(
    (category) => category.key === "housing_history",
  );

  if (
    overallScore >= 72 &&
    payment?.band !== "Weak" &&
    housing?.band !== "Weak" &&
    input.identityVerified
  ) {
    return "Recommended for manual approval path";
  }

  return "Needs manual review";
}

function buildTopDrivers(categories: TrustCategory[], verification: VerificationResult) {
  const strongestDrivers = categories
    .filter((category) => category.band === "Strong")
    .flatMap((category) => category.drivers)
    .slice(0, 4);

  return [
    ...strongestDrivers,
    ...verification.contradictions.slice(0, 1),
  ].slice(0, 4);
}

function buildMissingEvidence(input: ApplicantInput) {
  const missing = [];

  if (!input.bankConnected) {
    missing.push("No connected bank account signal");
  }

  if (!input.payStubUploaded) {
    missing.push("Income documents are missing");
  }

  if (input.housingDocumentNames.length === 0) {
    missing.push("No lease, rent ledger, or receipt uploaded");
  }

  if (!input.landlordReference) {
    missing.push("Optional landlord reference was not provided");
  }

  return missing;
}

function buildRiskFlags(
  input: ApplicantInput,
  verification: VerificationResult,
  categories: TrustCategory[],
) {
  const flags = [
    ...verification.contradictions,
    ...categories.flatMap((category) => category.flags),
  ];

  if (input.signalRecencyDays > 45) {
    flags.push("Some verified signals are older than 45 days.");
  }

  return Array.from(new Set(flags));
}

export function buildProfileSummary(input: ApplicantInput): ProfileSummary {
  const constrainedInput = applyConsentBoundaries(input);
  const preset = getPresetByKey(constrainedInput.persona);
  const generatedAt = new Date().toISOString();
  const verification = buildVerification(constrainedInput);
  const categories = createCategories(constrainedInput);
  const overallScore = computeOverallScore(categories);
  const confidence = computeConfidence(constrainedInput, verification);
  const recommendation = buildRecommendation(
    constrainedInput,
    verification,
    overallScore,
    confidence,
    categories,
  );
  const evidence = createEvidence(constrainedInput, generatedAt);
  const consent = constrainedInput.consentSources.map((source) =>
    createConsent(source, generatedAt),
  );
  const accessLogs: AccessLog[] = [
    {
      id: crypto.randomUUID(),
      actor: "system",
      action: "profile_generated",
      detail: "Rental reliability profile created from applicant-consented evidence.",
      at: generatedAt,
    },
  ];

  return {
    id: crypto.randomUUID(),
    applicantName: constrainedInput.applicantName,
    applicantEmail: constrainedInput.applicantEmail,
    persona: constrainedInput.persona,
    personaLabel: preset.label,
    targetRent: constrainedInput.targetRent,
    generatedAt,
    validUntil: addDays(new Date(generatedAt), 14),
    overallScore,
    confidence,
    recommendation,
    narrative: buildNarrative(
      preset,
      overallScore,
      confidence,
      recommendation,
      categories,
    ),
    topDrivers: buildTopDrivers(categories, verification),
    missingEvidence: buildMissingEvidence(constrainedInput),
    riskFlags: buildRiskFlags(constrainedInput, verification, categories),
    categories,
    evidence,
    consent,
    verification,
    disputes: [],
    accessLogs,
  };
}

function applyConsentBoundaries(input: ApplicantInput): ApplicantInput {
  const consented = new Set(input.consentSources);
  const bankAllowed = consented.has("bank_connection");
  const identityAllowed = consented.has("identity_check");
  const incomeAllowed = consented.has("income_docs");
  const housingAllowed = consented.has("housing_docs");

  return {
    ...input,
    identityVerified: identityAllowed ? input.identityVerified : false,
    accountOwnerMatch:
      identityAllowed && bankAllowed ? input.accountOwnerMatch : false,
    bankConnected: bankAllowed ? input.bankConnected : false,
    payStubUploaded: incomeAllowed ? input.payStubUploaded : false,
    housingDocumentNames: housingAllowed ? input.housingDocumentNames : [],
    incomeDocumentNames: incomeAllowed ? input.incomeDocumentNames : [],
  };
}
