"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PlaidLink } from "@/components/plaid-link";
import { scenarioPresets } from "@/lib/demo-scenarios";
import type { ApplicantInput, ProfileSummary } from "@/lib/types";

const initialInput = structuredClone(scenarioPresets[0].defaultInput);

type ConsentMap = Record<
  "identity_check" | "bank_connection" | "income_docs" | "housing_docs" | "report_share",
  boolean
>;

function consentMapFromInput(input: ApplicantInput): ConsentMap {
  return {
    identity_check: input.consentSources.includes("identity_check"),
    bank_connection: input.consentSources.includes("bank_connection"),
    income_docs: input.consentSources.includes("income_docs"),
    housing_docs: input.consentSources.includes("housing_docs"),
    report_share: input.consentSources.includes("report_share"),
  };
}

export function ApplicantBuilder({ sampleReportId }: { sampleReportId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ApplicantInput>(initialInput);
  const [consentMap, setConsentMap] = useState<ConsentMap>(
    consentMapFromInput(initialInput),
  );
  const [statusMessage, setStatusMessage] = useState(
    "Sandbox-ready. No raw bank transactions are ever shown to reviewers in this demo.",
  );

  const currentPreset = scenarioPresets.find(
    (preset) => preset.key === form.persona,
  );

  function applyPreset(key: ApplicantInput["persona"]) {
    const preset = scenarioPresets.find((entry) => entry.key === key);

    if (!preset) {
      return;
    }

    const next = structuredClone(preset.defaultInput);
    setForm(next);
    setConsentMap(consentMapFromInput(next));
    setStatusMessage(preset.summary);
  }

  function updateForm<K extends keyof ApplicantInput>(
    key: K,
    value: ApplicantInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateConsent(key: keyof ConsentMap, checked: boolean) {
    setConsentMap((current) => ({ ...current, [key]: checked }));
  }

  function handleFiles(
    key: "housingDocumentNames" | "incomeDocumentNames",
    files: FileList | null,
  ) {
    const names = files ? Array.from(files).map((file) => file.name) : [];
    updateForm(key, names);

    if (key === "housingDocumentNames" && names.length > 0) {
      updateConsent("housing_docs", true);
    }

    if (key === "incomeDocumentNames" && names.length > 0) {
      updateConsent("income_docs", true);
      updateForm("payStubUploaded", true);
    }
  }

  function connectSandboxBank() {
    updateForm("bankConnected", true);
    updateForm("accountOwnerMatch", true);
    updateConsent("bank_connection", true);
    setStatusMessage(
      "Sandbox bank connection loaded. Credora will share derived cash-flow signals, not raw transactions.",
    );
  }

  async function handlePlaidSuccess(publicToken: string) {
    setStatusMessage("Verifying bank connection...");
    try {
      const response = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });
      const data = await response.json();

      if (data.success) {
        updateForm("bankConnected", true);
        updateForm("accountOwnerMatch", true);
        updateConsent("bank_connection", true);
        setStatusMessage(
          "Bank connection verified via Plaid. Credora will share derived cash-flow signals, not raw transactions.",
        );
      } else {
        setStatusMessage("Failed to verify bank connection: " + data.error);
      }
    } catch (error) {
      console.error("Plaid exchange error:", error);
      setStatusMessage("An error occurred during bank verification.");
    }
  }

  function disconnectBank() {
    updateForm("bankConnected", false);
    updateConsent("bank_connection", false);
    setStatusMessage(
      "Bank connection removed. The profile can still be created from uploaded evidence, but confidence will be lower.",
    );
  }

  async function generateProfile() {
    const consentSources = Object.entries(consentMap)
      .filter(([, isActive]) => isActive)
      .map(([source]) => source) as ApplicantInput["consentSources"];

    if (!consentMap.report_share) {
      setStatusMessage(
        "Sharing consent is required before Credora can generate a reviewer-ready report.",
      );
      return;
    }

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        consentSources,
      }),
    });

    if (!response.ok) {
      setStatusMessage("We could not generate the profile. Please try again.");
      return;
    }

    const report = (await response.json()) as ProfileSummary;
    router.push(`/profile/${report.id}`);
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="stack-md">
          <span className="eyebrow">Applicant workspace</span>
          <h1>Build a housing-first trust profile in one sitting.</h1>
          <p className="lede">
            This flow keeps the scope narrow: rental screening only, with
            explicit consent, explainable categories, and a reviewer who still
            makes the final call.
          </p>
        </div>
        <div className="hero-callout">
          <span className="mini-label">Demo-ready principles</span>
          <ul className="list">
            <li>No hidden surveillance or data-broker enrichment</li>
            <li>Missing data lowers confidence, not character</li>
            <li>Applicant sees what the reviewer sees</li>
          </ul>
        </div>
      </section>

      <section className="section-grid">
        <div className="section-main stack-lg">
          <article className="card stack-md">
            <div className="row row--space-start row--top">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Step 1</span>
                <h2>Choose a demo persona</h2>
              </div>
              <Link className="text-link" href={`/review/${sampleReportId}`}>
                View seeded landlord demo
              </Link>
            </div>
            <div className="option-grid">
              {scenarioPresets.map((preset) => (
                <button
                  key={preset.key}
                  className={`option-card ${
                    form.persona === preset.key ? "option-card--active" : ""
                  }`}
                  onClick={() => applyPreset(preset.key)}
                  type="button"
                >
                  <span className="mini-label">{preset.label}</span>
                  <p>{preset.summary}</p>
                </button>
              ))}
            </div>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Step 2</span>
              <h2>Identity and rental context</h2>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Applicant name</span>
                <input
                  value={form.applicantName}
                  onChange={(event) => updateForm("applicantName", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.applicantEmail}
                  onChange={(event) => updateForm("applicantEmail", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Target rent</span>
                <input
                  type="number"
                  min={500}
                  step={50}
                  value={form.targetRent}
                  onChange={(event) =>
                    updateForm("targetRent", Number(event.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>Documented residency months</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.residencyMonths}
                  onChange={(event) =>
                    updateForm("residencyMonths", Number(event.target.value))
                  }
                />
              </label>
            </div>
            <div className="toggle-grid">
              <label className="toggle-card">
                <input
                  checked={form.identityVerified}
                  onChange={(event) =>
                    updateForm("identityVerified", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>ID verification complete</strong>
                  <p>Represents a Stripe Identity or manual ID verification outcome.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={form.accountOwnerMatch}
                  onChange={(event) =>
                    updateForm("accountOwnerMatch", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Bank account owner matches identity</strong>
                  <p>Critical guardrail for catching name mismatches and fraud risk.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={form.landlordReference}
                  onChange={(event) =>
                    updateForm("landlordReference", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Optional landlord reference provided</strong>
                  <p>Useful context, but never stronger than verified payment evidence.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={form.contradictionDetected}
                  onChange={(event) =>
                    updateForm("contradictionDetected", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Simulate an inconsistency flag</strong>
                  <p>Shows how Credora escalates to manual review instead of hiding conflicts.</p>
                </div>
              </label>
            </div>
          </article>

          <article className="card stack-md">
            <div className="row row--space-start row--top">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Step 3</span>
                <h2>Consent and data connection</h2>
              </div>
              <div className="button-row">
                <button
                  className="button button--secondary"
                  onClick={connectSandboxBank}
                  type="button"
                >
                  Load sandbox bank data
                </button>
                {/* 
                <PlaidLink
                  onSuccess={handlePlaidSuccess}
                  disabled={isPending}
                /> 
                */}
                <button
                  className="button button--ghost"
                  onClick={disconnectBank}
                  type="button"
                >
                  Remove bank data
                </button>
              </div>
            </div>
            <div className="consent-grid">
              <label className="toggle-card">
                <input
                  checked={consentMap.identity_check}
                  onChange={(event) =>
                    updateConsent("identity_check", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Identity verification consent</strong>
                  <p>Use identity checks only to confirm the applicant for housing screening.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={consentMap.bank_connection}
                  onChange={(event) =>
                    updateConsent("bank_connection", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Bank connection consent</strong>
                  <p>Share derived deposit, payment, and balance signals without exposing raw transactions.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={consentMap.income_docs}
                  onChange={(event) =>
                    updateConsent("income_docs", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Income document consent</strong>
                  <p>Allow pay stubs or payout summaries to support income regularity.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={consentMap.housing_docs}
                  onChange={(event) =>
                    updateConsent("housing_docs", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Housing history consent</strong>
                  <p>Use lease, rent ledger, or receipts for tenancy-relevant verification only.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={consentMap.report_share}
                  onChange={(event) =>
                    updateConsent("report_share", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>Single-reviewer share consent</strong>
                  <p>Required to create a landlord-facing report link with time-bound access.</p>
                </div>
              </label>
            </div>
            <p className="status-banner">{statusMessage}</p>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Step 4</span>
              <h2>Signals used by the scoring engine</h2>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Monthly income estimate</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={form.monthlyIncome}
                  onChange={(event) =>
                    updateForm("monthlyIncome", Number(event.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>Income regularity (0-100)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.incomeRegularity}
                  onChange={(event) =>
                    updateForm("incomeRegularity", Number(event.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>Average balance cushion</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={form.averageCushion}
                  onChange={(event) =>
                    updateForm("averageCushion", Number(event.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>Overdrafts in last 90 days</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.overdraftsLast90Days}
                  onChange={(event) =>
                    updateForm("overdraftsLast90Days", Number(event.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>Rent-payment continuity (months)</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.rentPaymentStreakMonths}
                  onChange={(event) =>
                    updateForm("rentPaymentStreakMonths", Number(event.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>Utility-payment continuity (months)</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.utilityPaymentStreakMonths}
                  onChange={(event) =>
                    updateForm("utilityPaymentStreakMonths", Number(event.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>Recency of strongest signal (days)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.signalRecencyDays}
                  onChange={(event) =>
                    updateForm("signalRecencyDays", Number(event.target.value))
                  }
                />
              </label>
              <label className="field field--wide">
                <span>Context note</span>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </label>
            </div>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Step 5</span>
              <h2>Upload supporting evidence</h2>
            </div>
            <div className="form-grid">
              <label className="field field--wide">
                <span>Housing documents</span>
                <input
                  multiple
                  onChange={(event) =>
                    handleFiles("housingDocumentNames", event.target.files)
                  }
                  type="file"
                />
                <small>
                  Demo supports lease files, rent ledgers, or receipt uploads. Only filenames are stored.
                </small>
              </label>
              <label className="field field--wide">
                <span>Income documents</span>
                <input
                  multiple
                  onChange={(event) =>
                    handleFiles("incomeDocumentNames", event.target.files)
                  }
                  type="file"
                />
                <small>
                  Demo supports pay stubs, employment letters, or platform payout summaries.
                </small>
              </label>
            </div>
            <div className="file-preview-grid">
              <div className="subtle-panel">
                <span className="mini-label">Housing files</span>
                <ul className="list">
                  {form.housingDocumentNames.length > 0 ? (
                    form.housingDocumentNames.map((name) => <li key={name}>{name}</li>)
                  ) : (
                    <li>No housing files selected yet.</li>
                  )}
                </ul>
              </div>
              <div className="subtle-panel">
                <span className="mini-label">Income files</span>
                <ul className="list">
                  {form.incomeDocumentNames.length > 0 ? (
                    form.incomeDocumentNames.map((name) => <li key={name}>{name}</li>)
                  ) : (
                    <li>No income files selected yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </article>
        </div>

        <aside className="section-side stack-md">
          <article className="card stack-md sticky-card">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Current scenario</span>
              <h2>{currentPreset?.label}</h2>
              <p className="body-muted">{currentPreset?.summary}</p>
            </div>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">What the reviewer will see</span>
              <ul className="list">
                <li>Category-by-category reliability bands</li>
                <li>Confidence level and missing evidence</li>
                <li>Uploaded evidence labels and reason codes</li>
              </ul>
            </div>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">What the reviewer will not see</span>
              <ul className="list">
                <li>Race, nationality, gender, disability, or social graph data</li>
                <li>Raw browsing history, contacts, or social media</li>
                <li>Automatic approval or denial decisions</li>
              </ul>
            </div>
            <button
              className="button button--primary"
              disabled={isPending}
              onClick={() => startTransition(() => void generateProfile())}
              type="button"
            >
              {isPending ? "Generating profile..." : "Generate rental reliability profile"}
            </button>
          </article>
        </aside>
      </section>
    </div>
  );
}
