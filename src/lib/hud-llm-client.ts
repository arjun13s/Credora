import OpenAI from "openai";
import type { ExternalEvaluatorRequest, ExternalEvaluatorResponse } from "@/lib/types";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.HUD_API_KEY;
  if (!apiKey) throw new Error("HUD_API_KEY is not set.");
  _client = new OpenAI({ baseURL: "https://inference.hud.ai", apiKey });
  return _client;
}

function buildSystemPrompt(): string {
  return `You are Credora's Housing Underwriting Decision (HUD) evaluator. You receive a structured evidence bundle about a rental applicant and produce a JSON evaluation response.

You MUST follow these rules:
- Missing evidence means UNCERTAINTY, never negative behavior.
- Never infer protected traits (race, religion, disability, family status, etc.).
- If contradictions exist, route to manual review.
- Be concise. Each string in arrays should be one clear sentence.
- Return ONLY valid JSON, no markdown fences, no commentary.

Your JSON response must have this exact shape:
{
  "overallScore": <number 0-100 or null>,
  "overallBand": "Strong" | "Moderate" | "Weak" | "Unknown",
  "confidence": "High" | "Medium" | "Low",
  "recommendationStatus": "Recommended" | "Needs manual review" | "Insufficient evidence" | "Potential inconsistency detected",
  "categoryScores": {
    "identity_confidence": <number 0-100 or null>,
    "housing_history": <number 0-100 or null>,
    "income_stability": <number 0-100 or null>,
    "payment_consistency": <number 0-100 or null>,
    "financial_stability": <number 0-100 or null>,
    "completeness_recency": <number 0-100 or null>
  },
  "strengths": [<string>, ...],
  "riskFlags": [<string>, ...],
  "issues": [<string>, ...],
  "missingEvidence": [<string>, ...],
  "evidenceUsed": [<string>, ...],
  "summary": "<1-2 sentence summary>",
  "manualReviewTriggers": [<string>, ...],
  "confidenceNotes": [<string>, ...]
}

Band rules: score >= 75 = "Strong", score >= 40 = "Moderate", score < 40 = "Weak", null = "Unknown".
Recommendation rules:
- "Recommended" only if score >= 80, confidence != "Low", 3+ verified categories, verified financial signal, no volatility, identity and housing both scored.
- "Potential inconsistency detected" if any contradictions exist.
- "Insufficient evidence" if fewer than 2 verified categories.
- Otherwise "Needs manual review".`;
}

function buildUserPrompt(request: ExternalEvaluatorRequest): string {
  const ev = request.normalizedEvidence;
  const feat = request.deterministicFeatures;

  return `Evaluate this rental applicant profile.

REQUEST ID: ${request.requestId}
USE CASE: ${request.useCase}
RUBRIC VERSION: ${request.rubricVersion}

APPLICANT CONTEXT:
- City: ${ev.applicantContext.city}, State: ${ev.applicantContext.state}
- Target Rent: $${ev.applicantContext.targetRent}/mo
- Current Rent: $${ev.applicantContext.currentRent}/mo

IDENTITY:
- Verified: ${ev.identity.identityVerified}
- Method: ${ev.identity.method || "none"}
- Account Owner Match: ${ev.identity.accountOwnerMatch}
- Government ID Documents: ${ev.identity.governmentIdDocumentCount}

INCOME:
- Employment Status: ${ev.income.employmentStatus || "not provided"}
- Income Type: ${ev.income.incomeType || "not provided"}
- Monthly Income: $${ev.income.monthlyIncome}
- Pay Frequency: ${ev.income.payFrequency || "not provided"}
- Income Coverage Ratio: ${ev.income.incomeCoverageRatio ?? "unknown"}
- Pay Stubs: ${ev.income.payStubDocumentCount}, Contracts: ${ev.income.contractDocumentCount}
- Employer Provided: ${ev.income.employerNameProvided}

HOUSING:
- Current Rent: $${ev.housing.currentRent}/mo
- Months at Residence: ${ev.housing.monthsAtResidence}
- Rent Payment Streak: ${ev.housing.rentPaymentStreakMonths} months
- Utility Payment Streak: ${ev.housing.utilityPaymentStreakMonths} months
- Lease Present: ${ev.housing.leasePresent}
- Rent Ledger Present: ${ev.housing.rentLedgerPresent}
- Receipts Present: ${ev.housing.receiptsPresent}
- Landlord Reference: ${ev.housing.landlordReferencePresent}

PAYMENTS & FINANCIAL STABILITY:
- Bank Connected: ${ev.payments.bankConnected}
- Average Balance Cushion: $${ev.payments.averageBalanceCushion}
- Overdrafts (last 90 days): ${ev.payments.overdraftsLast90Days}
- Recurring Bills Tracked: ${ev.payments.recurringBillsTracked}
- Signal Recency: ${ev.payments.signalRecencyDays} days

COMPLETENESS:
- Required Fields Present: ${ev.completeness.requiredFieldCodesPresent.length}
- Missing Fields: ${ev.completeness.missingFieldCodes.join(", ") || "none"}
- Optional Signals Present: ${ev.completeness.optionalSignalCodesPresent.length}
- Signal Recency: ${ev.completeness.signalRecencyDays} days

INCONSISTENCIES:
- Contradiction Detected: ${ev.inconsistencies.contradictionDetected}
- Flags: ${ev.inconsistencies.flags.join(", ") || "none"}
- Severity: ${ev.inconsistencies.severity}

EVIDENCE SUMMARY:
- Verified: ${ev.summary.verifiedCount}, Self-Reported: ${ev.summary.selfReportedCount}, Derived: ${ev.summary.derivedCount}, Missing: ${ev.summary.missingCount}

DETERMINISTIC RUBRIC REFERENCE (use as a baseline, you may adjust based on holistic assessment):
- Weighted Score: ${feat.weightedScore ?? "null"}
- Confidence: ${feat.confidenceFloor}
- Verified Categories: ${feat.verifiedCategoryCount}
- Contradictions: ${feat.contradictions.length > 0 ? feat.contradictions.join("; ") : "none"}
- Thin File: ${feat.thinFile}
- Reason Codes: ${feat.reasonCodes.join(", ") || "none"}

POLICY:
- Purpose: ${request.policy.purposeLimitedUse}
- Missing data = uncertainty (NOT negative)
- No protected trait inference
- Manual review required for inconsistency

Return your evaluation as a single JSON object. No markdown, no explanation.`;
}

function parseResponse(
  raw: string,
  requestId: string,
): ExternalEvaluatorResponse {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`HUD LLM returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  return {
    requestId,
    mode: "hud_remote",
    provider: "hud_remote",
    status: "completed",
    overallScore: typeof parsed.overallScore === "number" ? parsed.overallScore : null,
    overallBand: String(parsed.overallBand ?? "Unknown") as ExternalEvaluatorResponse["overallBand"],
    confidence: String(parsed.confidence ?? "Low") as ExternalEvaluatorResponse["confidence"],
    recommendationStatus: String(
      parsed.recommendationStatus ?? "Needs manual review",
    ) as ExternalEvaluatorResponse["recommendationStatus"],
    categoryScores: (parsed.categoryScores as ExternalEvaluatorResponse["categoryScores"]) ?? undefined,
    categoryBands: (parsed.categoryBands as ExternalEvaluatorResponse["categoryBands"]) ?? undefined,
    strengths: toStringArray(parsed.strengths),
    riskFlags: toStringArray(parsed.riskFlags),
    issues: toStringArray(parsed.issues),
    missingEvidence: toStringArray(parsed.missingEvidence),
    evidenceUsed: toStringArray(parsed.evidenceUsed),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    manualReviewTriggers: toStringArray(parsed.manualReviewTriggers),
    confidenceNotes: toStringArray(parsed.confidenceNotes),
    warnings: [],
    traceId: `hud-llm-${requestId.slice(0, 12)}`,
    evaluatedAt: new Date().toISOString(),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function callHudLlm(
  request: ExternalEvaluatorRequest,
): Promise<ExternalEvaluatorResponse> {
  const client = getClient();
  const model = process.env.HUD_MODEL ?? "fa-gpt-oss-20b";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(request) },
    ],
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("HUD LLM returned an empty response.");
  }

  return parseResponse(content, request.requestId);
}
