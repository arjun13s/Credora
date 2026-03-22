"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Logo } from "@/components/logo";
import type { ApplicantInput, ProfileSummary } from "@/lib/types";

type ConsentMap = Record<
  "identity_check" | "bank_connection" | "income_docs" | "housing_docs" | "report_share",
  boolean
>;

type FormState = {
  applicantName: string;
  applicantEmail: string;
  targetRent: number;
  monthlyIncome: number;
  averageCushion: number;
  incomeRegularity: number;
  rentPaymentStreakMonths: number;
  utilityPaymentStreakMonths: number;
  residencyMonths: number;
  overdraftsLast90Days: number;
  signalRecencyDays: number;
  identityVerified: boolean;
  accountOwnerMatch: boolean;
  bankConnected: boolean;
  payStubUploaded: boolean;
  landlordReference: boolean;
  contradictionDetected: boolean;
  housingDocumentNames: string[];
  incomeDocumentNames: string[];
  notes: string;
};

const blankForm: FormState = {
  applicantName: "",
  applicantEmail: "",
  targetRent: 0,
  monthlyIncome: 0,
  averageCushion: 0,
  incomeRegularity: 0,
  rentPaymentStreakMonths: 0,
  utilityPaymentStreakMonths: 0,
  residencyMonths: 0,
  overdraftsLast90Days: 0,
  signalRecencyDays: 1,
  identityVerified: false,
  accountOwnerMatch: false,
  bankConnected: false,
  payStubUploaded: false,
  landlordReference: false,
  contradictionDetected: false,
  housingDocumentNames: [],
  incomeDocumentNames: [],
  notes: "",
};

const blankConsentMap: ConsentMap = {
  identity_check: false,
  bank_connection: false,
  income_docs: false,
  housing_docs: false,
  report_share: false,
};

export function ApplicantBuilder() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(blankForm);
  const [consentMap, setConsentMap] = useState<ConsentMap>(blankConsentMap);
  const [error, setError] = useState("");

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function updateConsent(key: keyof ConsentMap, checked: boolean) {
    setConsentMap((c) => ({ ...c, [key]: checked }));
  }

  function handleFiles(
    key: "housingDocumentNames" | "incomeDocumentNames",
    files: FileList | null,
  ) {
    const names = files ? Array.from(files).map((f) => f.name) : [];
    updateForm(key, names);
    if (key === "housingDocumentNames" && names.length > 0) updateConsent("housing_docs", true);
    if (key === "incomeDocumentNames" && names.length > 0) {
      updateConsent("income_docs", true);
      updateForm("payStubUploaded", true);
    }
  }

  async function generateProfile() {
    if (!form.applicantName.trim()) {
      setError("Applicant name is required.");
      return;
    }
    if (!consentMap.report_share) {
      setError("Sharing consent is required before generating a reviewer-ready report.");
      return;
    }
    setError("");

    const consentSources = Object.entries(consentMap)
      .filter(([, v]) => v)
      .map(([k]) => k) as ApplicantInput["consentSources"];

    const payload: ApplicantInput = { ...form, consentSources };

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Could not generate the profile. Please try again.");
      return;
    }

    const report = (await response.json()) as ProfileSummary;
    router.push(`/profile/${report.id}`);
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <Logo size={32} />
            <span>Credora</span>
          </Link>
          <nav className="site-nav">
            <Link href="/">← Home</Link>
            <Link href="/review">Reviewer Portal</Link>
          </nav>
          <button
            className="button button--primary"
            disabled={isPending}
            onClick={() => startTransition(() => void generateProfile())}
            type="button"
          >
            {isPending ? "Generating..." : "Generate profile"}
          </button>
        </div>
      </header>

      {/* Full-width hero — outside page-shell so the border reaches the viewport edge */}
      <div style={{ borderBottom: "1px solid var(--border)", width: "100%" }}>
        <div className="page-shell" style={{ padding: "2rem 0 1.75rem" }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: "0.4rem" }}>
            Applicant Portal
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)", maxWidth: "none", marginBottom: "0.5rem", lineHeight: 1.05 }}>
            Establish Your Reliability Profile
          </h1>
          <p className="body-muted">
            Securely provide your financial and residential history to generate a comprehensive, verifiable profile.
          </p>
        </div>
      </div>

      <div className="page-shell">
        <div>
          <div className="stack-lg">

            {/* Personal details */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Step 1</span>
                <h2>Applicant Information</h2>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Full name</span>
                  <input
                    value={form.applicantName}
                    placeholder="Your name"
                    onChange={(e) => updateForm("applicantName", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.applicantEmail}
                    placeholder="you@example.com"
                    onChange={(e) => updateForm("applicantEmail", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Target rent ($/mo)</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={form.targetRent || ""}
                    placeholder="e.g. 1800"
                    onChange={(e) => updateForm("targetRent", Number(e.target.value))}
                  />
                </label>
              </div>
            </article>

            {/* Financial signals */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Step 2</span>
                <h2>Financial Metrics</h2>
                <p className="body-muted" style={{ marginTop: "0.25rem" }}>
                  These verified metrics formulate the core of your reliability assessment.
                </p>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Monthly income ($/mo)</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.monthlyIncome || ""}
                    placeholder="e.g. 4500"
                    onChange={(e) => updateForm("monthlyIncome", Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Avg. bank cushion after bills ($)</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.averageCushion || ""}
                    placeholder="e.g. 1200"
                    onChange={(e) => updateForm("averageCushion", Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Income regularity (0-100)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={form.incomeRegularity || ""}
                    placeholder="e.g. 80"
                    onChange={(e) => updateForm("incomeRegularity", Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Overdrafts in last 90 days</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.overdraftsLast90Days || ""}
                    placeholder="e.g. 0"
                    onChange={(e) => updateForm("overdraftsLast90Days", Number(e.target.value))}
                  />
                </label>
              </div>
            </article>

            {/* Payment history */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Step 3</span>
                <h2>Residence & Payment History</h2>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Rent payment streak (months)</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.rentPaymentStreakMonths || ""}
                    placeholder="e.g. 12"
                    onChange={(e) => updateForm("rentPaymentStreakMonths", Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Utility payment streak (months)</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.utilityPaymentStreakMonths || ""}
                    placeholder="e.g. 8"
                    onChange={(e) => updateForm("utilityPaymentStreakMonths", Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Residency length (months)</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.residencyMonths || ""}
                    placeholder="e.g. 18"
                    onChange={(e) => updateForm("residencyMonths", Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Days since most recent signal</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.signalRecencyDays || ""}
                    placeholder="e.g. 7"
                    onChange={(e) => updateForm("signalRecencyDays", Number(e.target.value))}
                  />
                </label>
              </div>
            </article>

            {/* Documents and verification */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Step 4</span>
                <h2>Documentation & Verification</h2>
                <p className="body-muted" style={{ marginTop: "0.25rem" }}>
                  Securely upload supporting documentation. Reviewers will only view the document classification and verification status, never the raw files.
                </p>
              </div>
              <div className="form-grid">
                <label className="field field--wide">
                  <span>Income documents (pay stubs, payout summaries)</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.csv,.jpg,.png"
                    onChange={(e) => handleFiles("incomeDocumentNames", e.target.files)}
                  />
                  {form.incomeDocumentNames.length > 0 && (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {form.incomeDocumentNames.join(", ")}
                    </span>
                  )}
                </label>
                <label className="field field--wide">
                  <span>Housing documents (lease, rent ledger, receipts)</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.csv,.jpg,.png"
                    onChange={(e) => handleFiles("housingDocumentNames", e.target.files)}
                  />
                  {form.housingDocumentNames.length > 0 && (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {form.housingDocumentNames.join(", ")}
                    </span>
                  )}
                </label>
              </div>
              <div className="consent-grid" style={{ marginTop: "0.5rem" }}>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={form.identityVerified}
                    onChange={(e) => updateForm("identityVerified", e.target.checked)}
                  />
                  <div>
                    <strong>Identity verified</strong>
                    <p>Government ID check completed.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={form.accountOwnerMatch}
                    onChange={(e) => updateForm("accountOwnerMatch", e.target.checked)}
                  />
                  <div>
                    <strong>Account owner match</strong>
                    <p>Connected bank account matches identity.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={form.bankConnected}
                    onChange={(e) => {
                      updateForm("bankConnected", e.target.checked);
                      updateConsent("bank_connection", e.target.checked);
                    }}
                  />
                  <div>
                    <strong>Bank connected</strong>
                    <p>Open banking connection active. Derived signals only.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={form.landlordReference}
                    onChange={(e) => updateForm("landlordReference", e.target.checked)}
                  />
                  <div>
                    <strong>Landlord reference</strong>
                    <p>Optional reference provided for follow-up.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={form.contradictionDetected}
                    onChange={(e) => updateForm("contradictionDetected", e.target.checked)}
                  />
                  <div>
                    <strong>Contradiction flag</strong>
                    <p>A conflict was detected in the submitted evidence.</p>
                  </div>
                </label>
              </div>
            </article>

            {/* Consent */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Step 5</span>
                <h2>Data Usage Consent</h2>
                <p className="body-muted" style={{ marginTop: "0.25rem" }}>
                  Manage your data permissions and sharing preferences.
                </p>
              </div>
              <div className="consent-grid">
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={consentMap.identity_check}
                    onChange={(e) => updateConsent("identity_check", e.target.checked)}
                  />
                  <div>
                    <strong>Identity verification</strong>
                    <p>Confirm identity for housing screening only.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={consentMap.bank_connection}
                    onChange={(e) => updateConsent("bank_connection", e.target.checked)}
                  />
                  <div>
                    <strong>Bank connection</strong>
                    <p>Share derived signals only. Not raw transactions.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={consentMap.income_docs}
                    onChange={(e) => updateConsent("income_docs", e.target.checked)}
                  />
                  <div>
                    <strong>Income documents</strong>
                    <p>Pay stubs or payout summaries for income regularity.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={consentMap.housing_docs}
                    onChange={(e) => updateConsent("housing_docs", e.target.checked)}
                  />
                  <div>
                    <strong>Housing history</strong>
                    <p>Lease or rent ledger for tenancy verification.</p>
                  </div>
                </label>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={consentMap.report_share}
                    onChange={(e) => updateConsent("report_share", e.target.checked)}
                  />
                  <div>
                    <strong>
                      Share with reviewer{" "}
                      <span style={{ color: "var(--caution)", fontSize: "0.78rem" }}>required</span>
                    </strong>
                    <p>Time-bound access link for one reviewer. Revocable anytime.</p>
                  </div>
                </label>
              </div>
            </article>

            {/* Generate CTA */}
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1.5rem",
                flexWrap: "wrap",
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-mid)",
              }}
            >
              <div>
                <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.2rem" }}>
                  Finalize Assessment
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Ensure data sharing consent is authorized prior to generating your profile link.
                </p>
                {error && (
                  <p style={{ fontSize: "0.85rem", color: "var(--caution)", marginTop: "0.4rem" }}>
                    {error}
                  </p>
                )}
              </div>
              <button
                className="button button--primary"
                disabled={isPending}
                onClick={() => startTransition(() => void generateProfile())}
                type="button"
                style={{ flexShrink: 0 }}
              >
                {isPending ? "Generating..." : "Generate reliability profile →"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
