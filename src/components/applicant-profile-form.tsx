"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Logo } from "@/components/logo";
import {
  createEmptyApplicantProfileInput,
  getApplicantProfileSectionCompleteness,
  isApplicantProfileSubmitReady,
} from "@/lib/profile-defaults";
import type { ApplicantProfileInput, ApplicantProfileView } from "@/lib/types";

type SubmitPhase = "idle" | "saving" | "creating" | "grading";

const initialInput = createEmptyApplicantProfileInput();

function numericDisplay(value: number): string {
  return String(value);
}

function parseNumeric(raw: string, fallback: number): number {
  if (raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function ApplicantProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState<ApplicantProfileInput>(initialInput);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Complete every required section to 100% before submitting. Credora keeps the profile private until you choose to publish a public snapshot later.",
  );
  const [isPending, startTransition] = useTransition();

  const completeness = getApplicantProfileSectionCompleteness(form);
  const allSectionsComplete = isApplicantProfileSubmitReady(form);

  function updateNested<K extends keyof ApplicantProfileInput, N extends keyof ApplicantProfileInput[K]>(
    section: K,
    key: N,
    value: ApplicantProfileInput[K][N],
  ) {
    setForm((current) => {
      const sectionValue = current[section] as unknown as Record<string, unknown>;

      return {
        ...current,
        [section]: {
          ...sectionValue,
          [key]: value,
        },
      };
    });
  }

  function setFileNames(
    section: "identityVerification" | "employmentIncome" | "housingHistory" | "supportingDocuments",
    key: string,
    files: FileList | null,
  ) {
    const names = files ? Array.from(files).map((file) => file.name) : [];
    setForm((current) => {
      const sectionValue = current[section] as unknown as Record<string, unknown>;

      return {
        ...current,
        [section]: {
          ...sectionValue,
          [key]: names,
        },
      };
    });
  }

  async function submitProfile() {
    if (!allSectionsComplete) {
      setStatusMessage("Every required section must be 100% complete before you can submit.");
      return;
    }

    setIssues({});
    setSubmitPhase("saving");
    setStatusMessage("Saving application details...");

    await new Promise((resolve) => setTimeout(resolve, 250));
    setSubmitPhase("creating");
    setStatusMessage("Creating your Applicant Profile...");

    await new Promise((resolve) => setTimeout(resolve, 250));
    setSubmitPhase("grading");
    setStatusMessage("Reviewing your application and generating your Applicant Profile results...");

    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as
      | { issues: Array<{ field: string; message: string }> }
      | { view: ApplicantProfileView };

    if (!response.ok) {
      const nextIssues: Record<string, string> = {};
      if ("issues" in payload) {
        payload.issues.forEach((issue) => {
          nextIssues[issue.field] = issue.message;
        });
      }
      setIssues(nextIssues);
      setSubmitPhase("idle");
      setStatusMessage("Please review the highlighted sections and try again.");
      return;
    }

    if ("view" in payload) {
      router.push(`/profiles/${payload.view.profile.id}`);
    }
  }

  const phaseLabel =
    submitPhase === "idle"
      ? "Ready to submit"
      : submitPhase === "saving"
        ? "Saving application"
        : submitPhase === "creating"
          ? "Creating profile"
          : "Grading profile";

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <Logo size={32} />
            <span>Credora</span>
          </Link>
          <nav className="site-nav">
            <Link href="/">Home</Link>
            <Link href="/blockchain-technology">Blockchain technology</Link>
            <Link href="/review">Published Snapshots</Link>
          </nav>
        </div>
      </header>

      <div className="page-shell">
        <section className="page-hero">
          <div className="stack-md">
            <span className="eyebrow">Applicant Profile</span>
            <h1>Build one housing application profile that explains your reliability clearly.</h1>
          <p className="lede">
            Submit one housing application profile, review the result privately,
            then choose whether to publish a public version.
          </p>
        </div>
        <div className="hero-callout stack-md">
          <div className="subtle-panel stack-sm">
            <span className="mini-label">What this profile is</span>
            <ul className="list">
              <li>A housing-specific reliability assessment</li>
              <li>Explainable and confidence-aware</li>
              <li>Visible to the applicant before any publication</li>
            </ul>
          </div>
          <div className="subtle-panel stack-sm">
            <span className="mini-label">What it is not</span>
            <ul className="list">
              <li>Not a universal trust score</li>
              <li>Not a morality score</li>
              <li>Not a hidden surveillance profile</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-grid">
        <div className="section-main stack-lg">
          <article className="card stack-md">
            <div className="row row--space-start">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Personal Information</span>
                <h2>Who is applying</h2>
              </div>
              <span className="chip chip--outline">{completeness.personal}% complete</span>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Full name</span>
                <input
                  value={form.personalInformation.fullName}
                  onChange={(event) =>
                    updateNested("personalInformation", "fullName", event.target.value)
                  }
                />
                {issues["personalInformation.fullName"] ? (
                  <small>{issues["personalInformation.fullName"]}</small>
                ) : null}
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.personalInformation.email}
                  onChange={(event) =>
                    updateNested("personalInformation", "email", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  value={form.personalInformation.phone}
                  onChange={(event) =>
                    updateNested("personalInformation", "phone", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>City</span>
                <input
                  value={form.personalInformation.city}
                  onChange={(event) =>
                    updateNested("personalInformation", "city", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>State</span>
                <input
                  value={form.personalInformation.state}
                  onChange={(event) =>
                    updateNested("personalInformation", "state", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>Target rent</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.personalInformation.targetRent)}
                  onChange={(event) =>
                    updateNested(
                      "personalInformation",
                      "targetRent",
                      parseNumeric(event.target.value, 0),
                    )
                  }
                />
              </label>
            </div>
          </article>

          <article className="card stack-md">
            <div className="row row--space-start">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Identity Verification</span>
                <h2>Show how your identity can be verified</h2>
              </div>
              <span className="chip chip--outline">{completeness.identity}% complete</span>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Identity method</span>
                <select
                  value={form.identityVerification.identityMethod}
                  onChange={(event) =>
                    updateNested(
                      "identityVerification",
                      "identityMethod",
                      event.target.value as ApplicantProfileInput["identityVerification"]["identityMethod"],
                    )
                  }
                >
                  <option value="">Select one</option>
                  <option value="government_id">Government ID</option>
                  <option value="passport">Passport</option>
                  <option value="state_id">State ID</option>
                  <option value="bank_account_match">Bank account match</option>
                  <option value="manual_review">Manual review</option>
                </select>
              </label>
              <label className="field field--wide">
                <span>Identity documents</span>
                <input
                  accept="image/*,.pdf"
                  multiple
                  type="file"
                  onChange={(event) =>
                    setFileNames(
                      "identityVerification",
                      "governmentIdFileNames",
                      event.target.files,
                    )
                  }
                />
                <small>Required. Upload an image or document for identity verification.</small>
              </label>
            </div>
          </article>

          <article className="card stack-md">
            <div className="row row--space-start">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Employment / Income</span>
                <h2>Explain your earning context</h2>
              </div>
              <span className="chip chip--outline">{completeness.income}% complete</span>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Employment status</span>
                <select
                  value={form.employmentIncome.employmentStatus}
                  onChange={(event) =>
                    updateNested(
                      "employmentIncome",
                      "employmentStatus",
                      event.target.value as ApplicantProfileInput["employmentIncome"]["employmentStatus"],
                    )
                  }
                >
                  <option value="">Select one</option>
                  <option value="full_time">Full time</option>
                  <option value="part_time">Part time</option>
                  <option value="self_employed">Self employed</option>
                  <option value="gig_worker">Gig worker</option>
                  <option value="student">Student</option>
                  <option value="between_roles">Between roles</option>
                </select>
              </label>
              <label className="field">
                <span>Employer or platform</span>
                <input
                  value={form.employmentIncome.employerName}
                  onChange={(event) =>
                    updateNested("employmentIncome", "employerName", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>Monthly income estimate</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.employmentIncome.monthlyIncome)}
                  onChange={(event) =>
                    updateNested(
                      "employmentIncome",
                      "monthlyIncome",
                      parseNumeric(event.target.value, 0),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Income type</span>
                <select
                  value={form.employmentIncome.incomeType}
                  onChange={(event) =>
                    updateNested(
                      "employmentIncome",
                      "incomeType",
                      event.target.value as ApplicantProfileInput["employmentIncome"]["incomeType"],
                    )
                  }
                >
                  <option value="">Select one</option>
                  <option value="salary">Salary</option>
                  <option value="hourly">Hourly</option>
                  <option value="contract">Contract</option>
                  <option value="gig">Gig</option>
                  <option value="stipend">Stipend</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label className="field">
                <span>Pay frequency</span>
                <select
                  value={form.employmentIncome.payFrequency}
                  onChange={(event) =>
                    updateNested(
                      "employmentIncome",
                      "payFrequency",
                      event.target.value as ApplicantProfileInput["employmentIncome"]["payFrequency"],
                    )
                  }
                >
                  <option value="">Select one</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="semi_monthly">Semi-monthly</option>
                  <option value="monthly">Monthly</option>
                  <option value="irregular">Irregular</option>
                </select>
              </label>
              <label className="field field--wide">
                <span>Income documents</span>
                <input
                  multiple
                  type="file"
                  onChange={(event) =>
                    setFileNames("employmentIncome", "payStubFileNames", event.target.files)
                  }
                />
              </label>
            </div>
          </article>

          <article className="card stack-md">
            <div className="row row--space-start">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Housing / Rent History</span>
                <h2>Show your housing consistency</h2>
              </div>
              <span className="chip chip--outline">{completeness.housing}% complete</span>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Current rent</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.housingHistory.currentRent)}
                  onChange={(event) =>
                    updateNested("housingHistory", "currentRent", parseNumeric(event.target.value, 0))
                  }
                />
              </label>
              <label className="field">
                <span>Months at current residence</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.housingHistory.monthsAtResidence)}
                  onChange={(event) =>
                    updateNested(
                      "housingHistory",
                      "monthsAtResidence",
                      parseNumeric(event.target.value, 0),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Rent continuity (months)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.housingHistory.rentPaymentStreakMonths)}
                  onChange={(event) =>
                    updateNested(
                      "housingHistory",
                      "rentPaymentStreakMonths",
                      parseNumeric(event.target.value, 0),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Utility continuity (months)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.housingHistory.utilityPaymentStreakMonths)}
                  onChange={(event) =>
                    updateNested(
                      "housingHistory",
                      "utilityPaymentStreakMonths",
                      parseNumeric(event.target.value, 0),
                    )
                  }
                />
              </label>
              <label className="field field--wide">
                <span>Lease, rent ledger, or receipts</span>
                <input
                  multiple
                  type="file"
                  onChange={(event) =>
                    setFileNames("housingHistory", "leaseFileNames", event.target.files)
                  }
                />
              </label>
              <label className="field">
                <span>Landlord reference name</span>
                <input
                  value={form.housingHistory.landlordReferenceName}
                  onChange={(event) =>
                    updateNested(
                      "housingHistory",
                      "landlordReferenceName",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </article>

          <article className="card stack-md">
            <div className="row row--space-start">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Financial Stability</span>
                <h2>Add banking and stability context</h2>
              </div>
              <span className="chip chip--outline">{completeness.financial}% complete</span>
            </div>
            <div className="button-row">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => {
                  updateNested("financialStability", "bankConnected", true);
                  updateNested("financialStability", "recurringBillsTracked", true);
                  updateNested("consents", "bank_connection", true);
                  setStatusMessage(
                    "Bank connection enabled. Credora uses only derived cash-flow signals, not raw transactions.",
                  );
                }}
              >
                Connect bank
              </button>
              <small>Required.</small>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Average balance cushion</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.financialStability.averageBalanceCushion)}
                  onChange={(event) =>
                    updateNested(
                      "financialStability",
                      "averageBalanceCushion",
                      parseNumeric(event.target.value, 0),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Overdrafts in last 90 days</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.financialStability.overdraftsLast90Days)}
                  onChange={(event) =>
                    updateNested(
                      "financialStability",
                      "overdraftsLast90Days",
                      parseNumeric(event.target.value, 0),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Most recent signal age (days)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericDisplay(form.financialStability.signalRecencyDays)}
                  onChange={(event) =>
                    updateNested(
                      "financialStability",
                      "signalRecencyDays",
                      parseNumeric(event.target.value, 1),
                    )
                  }
                />
              </label>
            </div>
          </article>

          <article className="card stack-md">
            <div className="row row--space-start">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Supporting Documents</span>
                <h2>Add any other context you want considered</h2>
              </div>
              <span className="chip chip--outline">Optional</span>
            </div>
            <label className="field field--wide">
              <span>Additional supporting files</span>
              <input
                multiple
                type="file"
                onChange={(event) =>
                  setFileNames("supportingDocuments", "additionalFileNames", event.target.files)
                }
              />
              <small>
                Use this for extra receipts, letters, or supporting context that can strengthen
                the scored profile before you decide whether to publish it.
              </small>
            </label>
          </article>

          <article className="card stack-md">
            <div className="row row--space-start">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Consent / Review</span>
                <h2>Control what Credora can use and share</h2>
              </div>
              <span className="chip chip--outline">{completeness.consent}% complete</span>
            </div>
            <div className="consent-grid">
              {(
                [
                  ["identity_check", "Use identity evidence for housing review."],
                  ["bank_connection", "Use connected cash-flow signals for housing review."],
                  ["income_docs", "Use income-supporting documents for grading."],
                  ["housing_docs", "Use housing documents and receipts for grading."],
                ] as const
              ).map(([key, description]) => (
                <label key={key} className="toggle-card">
                  <input
                    checked={form.consents[key]}
                    onChange={(event) =>
                      updateNested("consents", key, event.target.checked)
                    }
                    type="checkbox"
                  />
                  <div>
                    <strong>{key.replaceAll("_", " ")}</strong>
                    <p>{description}</p>
                  </div>
                </label>
              ))}
              <label className="toggle-card">
                <input
                  checked={form.consents.consentToSubmit}
                  onChange={(event) =>
                    updateNested("consents", "consentToSubmit", event.target.checked)
                  }
                  type="checkbox"
                />
                <div>
                  <strong>I consent to submit this Applicant Profile</strong>
                  <p>Required. Credora uses this profile only for the housing application context shown here.</p>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  checked={form.consents.retentionAcknowledged}
                  onChange={(event) =>
                    updateNested(
                      "consents",
                      "retentionAcknowledged",
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <div>
                  <strong>I understand the retention window</strong>
                  <p>Required. If I later publish a public snapshot, that public version cannot be undone.</p>
                </div>
              </label>
            </div>
            <p className="status-banner">{statusMessage}</p>
          </article>
        </div>

        <aside className="section-side stack-md">
          <article className="card stack-md sticky-card">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Profile summary</span>
              <h2>What will happen on submit</h2>
            </div>
            <ul className="list">
              <li>Your application data is saved.</li>
              <li>A private Applicant Profile is created.</li>
              <li>Credora reviews the information you choose to share and generates a housing-specific profile.</li>
              <li>You review the results privately before deciding whether to publish a permanent public snapshot.</li>
            </ul>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">Current submit phase</span>
              <strong>{phaseLabel}</strong>
            </div>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">Submit requirement</span>
              <strong>
                {allSectionsComplete
                  ? "All required sections are complete."
                  : "Every required section must reach 100% before submit unlocks."}
              </strong>
            </div>
            <div className="subtle-panel stack-sm">
                <span className="mini-label">Section completeness</span>
                <ul className="list">
                  <li>Personal information: {completeness.personal}%</li>
                  <li>Identity verification: {completeness.identity}%</li>
                <li>Employment / income: {completeness.income}%</li>
                <li>Housing history: {completeness.housing}%</li>
                <li>Financial stability: {completeness.financial}%</li>
                <li>Consent / review: {completeness.consent}%</li>
              </ul>
            </div>
            <button
              className="button button--primary"
              disabled={isPending || !allSectionsComplete}
              onClick={() => startTransition(() => void submitProfile())}
              type="button"
              title={
                allSectionsComplete
                  ? "Submit Applicant Profile"
                  : "Complete every required section to 100% before submitting"
              }
            >
              {isPending ? "Submitting..." : "Submit Applicant Profile"}
            </button>
          </article>
        </aside>
      </section>
    </div>
    </>
  );
}
