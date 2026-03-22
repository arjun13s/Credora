import type {
  CategoryAssessment,
  ConfidenceBand,
  DeterministicFeatureSet,
  FinalGradingResult,
  NormalizedEvidenceBundle,
  RecommendationStatus,
  TrustBand,
} from "@/lib/types";

const RUBRIC_WEIGHTS: Record<CategoryAssessment["key"], number> = {
  identity_confidence: 15,
  housing_history: 25,
  income_stability: 20,
  payment_consistency: 20,
  financial_stability: 10,
  completeness_recency: 10,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function bandFromScore(score: number | null): TrustBand {
  if (score === null) {
    return "Unknown";
  }
  if (score >= 75) {
    return "Strong";
  }
  if (score >= 40) {
    return "Moderate";
  }
  return "Weak";
}

function confidenceFromRaw(value: number): ConfidenceBand {
  if (value >= 76) {
    return "High";
  }
  if (value >= 56) {
    return "Medium";
  }
  return "Low";
}

function makeAssessment(
  key: CategoryAssessment["key"],
  title: string,
  score: number | null,
  rationale: string,
  evidenceLabels: string[],
  flags: string[],
  coverage: CategoryAssessment["coverage"],
): CategoryAssessment {
  return {
    key,
    title,
    score: score === null ? null : clamp(Math.round(score), 0, 100),
    band: bandFromScore(score === null ? null : Math.round(score)),
    rationale,
    evidenceLabels,
    flags,
    coverage,
  };
}

function unique(list: string[]) {
  return Array.from(new Set(list.filter((entry) => entry.trim().length > 0)));
}

function buildCategoryAssessments(bundle: NormalizedEvidenceBundle): CategoryAssessment[] {
  const { identity, housing, income, payments, completeness, inconsistencies } = bundle;
  const contradictionFlags = inconsistencies.flags.map((flag) =>
    flag === "account_owner_mismatch"
      ? "Account-owner mismatch requires manual review."
      : "Applicant disclosed a contradiction that requires manual review.",
  );

  const identityScore = identity.identityVerified
    ? clamp(
        72 +
          (identity.accountOwnerMatch ? 16 : -22) +
          Math.min(identity.governmentIdDocumentCount, 2) * 4,
        0,
        100,
      )
    : null;

  const housingVerified =
    housing.leasePresent || housing.rentLedgerPresent || housing.receiptsPresent;
  const housingScore = housingVerified
    ? clamp(
        36 +
          housing.rentPaymentStreakMonths * 3.5 +
          housing.utilityPaymentStreakMonths * 1.2 +
          Math.min(housing.monthsAtResidence, 24) * 0.8 +
          (housing.landlordReferencePresent ? 6 : 0) -
          (housing.leasePresent ? 0 : 14) -
          (housing.receiptsPresent ? 0 : 8),
        0,
        100,
      )
    : null;

  const incomeVerified = income.payStubDocumentCount + income.contractDocumentCount > 0;
  const incomeScore = incomeVerified
    ? clamp(
        34 +
          Math.min(income.incomeCoverageRatio ?? 0, 4) * 13 +
          (income.payFrequency === "irregular" ? -6 : 6) +
          Math.min(income.payStubDocumentCount + income.contractDocumentCount, 2) * 5,
        0,
        100,
      )
    : null;

  const paymentScore = payments.bankConnected
    ? clamp(
        54 +
          Math.min(housing.rentPaymentStreakMonths, 12) * 2.4 +
          (payments.recurringBillsTracked ? 7 : 0) -
          payments.overdraftsLast90Days * 11,
        0,
        100,
      )
    : null;

  const stabilityScore = payments.bankConnected
    ? clamp(
        42 +
          (payments.averageBalanceCushion / Math.max(bundle.applicantContext.currentRent, 1)) * 18 -
          payments.overdraftsLast90Days * 12 +
          (payments.recurringBillsTracked ? 8 : 0),
        0,
        100,
      )
    : null;

  const completenessRatio =
    completeness.requiredFieldCodesPresent.length /
    Math.max(
      completeness.requiredFieldCodesPresent.length + completeness.missingFieldCodes.length,
      1,
    );
  const optionalRatio =
    completeness.optionalSignalCodesPresent.length /
    Math.max(completeness.optionalSignalCodesPresent.length + 6, 1);
  const completenessScore = clamp(
    32 +
      completenessRatio * 36 +
      optionalRatio * 18 +
      (completeness.signalRecencyDays <= 21 ? 10 : completeness.signalRecencyDays <= 45 ? 4 : -4) -
      contradictionFlags.length * 10,
    0,
    100,
  );

  return [
    makeAssessment(
      "identity_confidence",
      "Identity confidence",
      identityScore,
      identityScore === null
        ? "Identity remains self-reported because no verified identity evidence was shared."
        : "Identity confidence comes from verified identity evidence and account-owner alignment.",
      ["Identity verification readiness"],
      contradictionFlags,
      identityScore === null ? "missing" : "verified",
    ),
    makeAssessment(
      "housing_history",
      "Housing reliability",
      housingScore,
      housingScore === null
        ? "Housing history remains mostly self-reported because no verified rent documents were shared."
        : "Housing reliability is based on rent continuity and uploaded housing records.",
      ["Housing history"],
      housing.rentLedgerPresent ? [] : ["No verified rent ledger was uploaded."],
      housingScore === null ? "self_reported" : "verified",
    ),
    makeAssessment(
      "income_stability",
      "Income stability",
      incomeScore,
      incomeScore === null
        ? "Income is currently self-reported, so this category stays uncertain."
        : "Income stability is assessed in relation to target rent and supporting documents.",
      ["Employment and income context"],
      income.incomeCoverageRatio !== null && income.incomeCoverageRatio < 2
        ? ["Income coverage is thin relative to target rent."]
        : [],
      incomeScore === null ? "self_reported" : "verified",
    ),
    makeAssessment(
      "payment_consistency",
      "Payment consistency",
      paymentScore,
      paymentScore === null
        ? "No verified payment stream was shared, so this category remains unknown."
        : "Payment consistency uses verified banking signals when available.",
      ["Payment and cash-flow signals", "Housing history"],
      payments.overdraftsLast90Days > 0
        ? [`${payments.overdraftsLast90Days} overdraft event(s) were disclosed in the last 90 days.`]
        : [],
      payments.bankConnected ? "verified" : "missing",
    ),
    makeAssessment(
      "financial_stability",
      "Financial stability",
      stabilityScore,
      stabilityScore === null
        ? "No verified bank-connected stability signal was shared."
        : "Financial stability reflects balance cushion and recent overdraft disclosures.",
      ["Financial stability inputs"],
      payments.bankConnected ? [] : ["No verified bank-connected stability signal was shared."],
      stabilityScore === null ? "missing" : "verified",
    ),
    makeAssessment(
      "completeness_recency",
      "Completeness and recency",
      completenessScore,
      "Completeness lowers or raises confidence, but it does not convert missing evidence into bad behavior.",
      ["Completeness and recency"],
      [
        ...(completeness.signalRecencyDays > 45
          ? ["The most recent evidence may be getting stale."]
          : []),
        ...completeness.missingFieldCodes.slice(0, 2).map((field) => `Missing field: ${field}.`),
      ],
      "mixed",
    ),
  ];
}

export function buildDeterministicEvaluation(bundle: NormalizedEvidenceBundle): {
  features: DeterministicFeatureSet;
  finalResult: FinalGradingResult;
} {
  const categoryAssessments = buildCategoryAssessments(bundle);
  const contradictions = unique(
    bundle.inconsistencies.flags.map((flag) =>
      flag === "account_owner_mismatch"
        ? "Connected financial ownership does not fully match the stated identity."
        : "Applicant-submitted evidence contains a contradiction that needs human review.",
    ),
  );
  const strengths: string[] = [];
  const issues: string[] = [];
  const missingEvidence: string[] = [];
  const manualReviewTriggers: string[] = [];
  const reasonCodes: string[] = [];

  const scoredCategories = categoryAssessments.filter(
    (category): category is CategoryAssessment & { score: number } => typeof category.score === "number",
  );

  if (bundle.identity.identityVerified) {
    strengths.push("Identity evidence has been verified.");
  } else {
    missingEvidence.push("Identity verification is incomplete.");
    reasonCodes.push("missing_identity_verification");
  }

  if (bundle.housing.provenance.kind === "verified") {
    strengths.push("Verified housing documents were provided.");
  } else {
    missingEvidence.push("No verified lease, rent ledger, or rent receipts were uploaded.");
    reasonCodes.push("missing_verified_housing_docs");
  }

  if (bundle.income.provenance.kind === "verified") {
    strengths.push("Income-supporting documents were included.");
  } else {
    missingEvidence.push("Income documents are missing.");
    reasonCodes.push("missing_verified_income_docs");
  }

  if (bundle.payments.bankConnected) {
    strengths.push("A bank-connected payment signal was shared.");
  } else {
    missingEvidence.push("No bank-connected payment signal was shared.");
    reasonCodes.push("missing_bank_signal");
  }

  if (!bundle.housing.landlordReferencePresent) {
    issues.push("No landlord reference was supplied.");
  }

  if (
    bundle.income.incomeCoverageRatio !== null &&
    bundle.income.incomeCoverageRatio > 0 &&
    bundle.income.incomeCoverageRatio < 2
  ) {
    issues.push("Income coverage is thin relative to target rent.");
    reasonCodes.push("thin_income_coverage");
  }

  if (bundle.payments.overdraftsLast90Days > 0) {
    issues.push(`${bundle.payments.overdraftsLast90Days} overdraft event(s) were disclosed in the last 90 days.`);
    reasonCodes.push("recent_overdrafts_disclosed");
  }

  if (bundle.completeness.signalRecencyDays > 45) {
    issues.push("The most recent evidence may be stale.");
    reasonCodes.push("stale_evidence_window");
  }

  if (bundle.completeness.missingFieldCodes.length > 0) {
    reasonCodes.push("missing_required_fields");
  }

  if (contradictions.length > 0) {
    manualReviewTriggers.push("A contradiction was detected in applicant-provided evidence.");
    reasonCodes.push("contradiction_detected");
  }

  const baseWeightedScore =
    scoredCategories.length > 0
      ? Math.round(
          scoredCategories.reduce(
            (sum, category) => sum + category.score * RUBRIC_WEIGHTS[category.key],
            0,
          ) /
            scoredCategories.reduce((sum, category) => sum + RUBRIC_WEIGHTS[category.key], 0),
        )
      : null;

  const verifiedCategoryCount = categoryAssessments.filter(
    (category) =>
      category.key !== "completeness_recency" &&
      (category.coverage === "verified" || category.coverage === "mixed"),
  ).length;
  const selfReportedCategoryCount = categoryAssessments.filter(
    (category) => category.key !== "completeness_recency" && category.coverage === "self_reported",
  ).length;
  const hasVerifiedFinancialSignal =
    bundle.income.provenance.kind === "verified" || bundle.payments.bankConnected;
  const verifiedEvidenceCount = bundle.summary.verifiedCount;
  const cautionaryVolatility =
    bundle.income.payFrequency === "irregular" ||
    bundle.payments.overdraftsLast90Days > 0 ||
    bundle.housing.monthsAtResidence < 6;
  const coverageScore = Math.round(
    ((verifiedCategoryCount * 2 + selfReportedCategoryCount) /
      Math.max((categoryAssessments.length - 1) * 2, 1)) *
      100,
  );
  const thinFile = verifiedCategoryCount < 3 && contradictions.length === 0;

  const coverageCap =
    contradictions.length > 0
      ? 74
      : cautionaryVolatility
        ? 74
        : verifiedCategoryCount >= 4
      ? 100
      : verifiedCategoryCount === 3
        ? hasVerifiedFinancialSignal
          ? 85
          : 74
        : verifiedCategoryCount === 2
          ? hasVerifiedFinancialSignal
            ? 70
            : 62
          : 58;
  const weightedScore =
    baseWeightedScore === null ? null : Math.min(baseWeightedScore, coverageCap);

  if (thinFile) {
    manualReviewTriggers.push(
      "Thin-file profile should be treated as uncertainty, not as negative behavior.",
    );
    reasonCodes.push("thin_file_profile");
  }

  if (weightedScore === null || verifiedCategoryCount < 2) {
    manualReviewTriggers.push("Evidence coverage remains too limited for a confident recommendation.");
    reasonCodes.push("insufficient_verified_coverage");
  }

  const confidenceRaw = clamp(
    26 +
      verifiedCategoryCount * 14 +
      bundle.summary.verifiedCount * 6 +
      (bundle.completeness.signalRecencyDays <= 21
        ? 4
        : bundle.completeness.signalRecencyDays <= 45
          ? 1
          : -6) -
      bundle.completeness.missingFieldCodes.length * 2 -
      contradictions.length * 40 -
      selfReportedCategoryCount * 4 -
      bundle.payments.overdraftsLast90Days * 8 -
      (bundle.income.payFrequency === "irregular" ? 10 : 0) -
      (bundle.housing.monthsAtResidence < 6 ? 10 : 0) -
      (!hasVerifiedFinancialSignal ? 8 : 0),
    0,
    100,
  );
  let confidenceFloor = confidenceFromRaw(confidenceRaw);

  if (contradictions.length > 0) {
    confidenceFloor = "Low";
  } else if (thinFile && !hasVerifiedFinancialSignal) {
    confidenceFloor = "Low";
  } else if (cautionaryVolatility && confidenceFloor === "High") {
    confidenceFloor = "Medium";
  }

  let recommendation: RecommendationStatus = "Needs manual review";

  if (contradictions.length > 0) {
    recommendation = "Potential inconsistency detected";
  } else if (verifiedCategoryCount < 2 || weightedScore === null) {
    recommendation = "Insufficient evidence";
  } else if (
    weightedScore >= 80 &&
    confidenceFloor !== "Low" &&
    verifiedCategoryCount >= 3 &&
    hasVerifiedFinancialSignal &&
    !cautionaryVolatility &&
    categoryAssessments.find((category) => category.key === "identity_confidence")?.score !== null &&
    categoryAssessments.find((category) => category.key === "housing_history")?.score !== null
  ) {
    recommendation = "Recommended";
  }

  const confidenceNotes = [
    thinFile
      ? "This is a thin-file applicant profile. Missing evidence reduces confidence, but it is not treated as bad behavior."
      : "Confidence reflects the amount, provenance, and recency of the evidence shared.",
    contradictions.length > 0
      ? "A contradiction was detected, so manual review remains necessary."
      : "No direct contradictions were detected in the normalized evidence bundle.",
  ];

  const summary =
    recommendation === "Recommended"
      ? "Credora found a verified mix of identity, housing, income, and payment evidence that supports a positive rental-context recommendation."
      : recommendation === "Insufficient evidence"
        ? "Credora structured the application successfully, but there is not yet enough verified evidence to support a confident housing recommendation."
        : recommendation === "Potential inconsistency detected"
          ? "Credora found a conflict in the submitted evidence and routed the profile to manual review instead of pretending certainty."
          : "Credora found useful housing-specific signals, but the application still needs human review because the evidence mix is partial or borderline.";

  const finalResult: FinalGradingResult = {
    overallScore: weightedScore,
    overallBand: bandFromScore(weightedScore),
    confidence: confidenceFloor,
    recommendationStatus: recommendation,
    strengths: unique(strengths).slice(0, 5),
    riskFlags: unique([...issues, ...contradictions]).slice(0, 6),
    issues: unique(issues).slice(0, 6),
    missingEvidence: unique(missingEvidence).slice(0, 6),
    evidenceUsed: unique(categoryAssessments.flatMap((category) => category.evidenceLabels)).slice(0, 8),
    summary,
    manualReviewTriggers: unique(manualReviewTriggers).slice(0, 5),
    confidenceNotes,
    categoryAssessments,
  };

  return {
    features: {
      weightedScore,
      weightedBand: bandFromScore(weightedScore),
      confidenceFloor,
      coverageScore,
      contradictions,
      thinFile,
      verifiedEvidenceCount,
      verifiedCategoryCount,
      selfReportedCategoryCount,
      missingEvidence: finalResult.missingEvidence,
      strengths: finalResult.strengths,
      issues: finalResult.issues,
      manualReviewTriggers: finalResult.manualReviewTriggers,
      reasonCodes: unique(reasonCodes),
      rubricWeights: RUBRIC_WEIGHTS,
      categoryAssessments,
    },
    finalResult,
  };
}
