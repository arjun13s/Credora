"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { BandPill } from "@/components/band-pill";
import { CategoryCard } from "@/components/category-card";
import { ConsentCard } from "@/components/consent-card";
import { EvidenceCard } from "@/components/evidence-card";
import { RecommendationBanner } from "@/components/recommendation-banner";
import { formatDateTime } from "@/lib/format";
import type { ProfileSummary } from "@/lib/types";

export function ReportPageClient({ initialReport }: { initialReport: ProfileSummary }) {
  const [report, setReport] = useState(initialReport);
  const [field, setField] = useState("income support");
  const [explanation, setExplanation] = useState("");
  const [copyState, setCopyState] = useState("Copy reviewer link");
  const [isPending, startTransition] = useTransition();
  const hasLogged = useRef(false);

  const shareConsent = report.consent.find((grant) => grant.source === "report_share");
  const shareLink =
    typeof window === "undefined"
      ? `/review/${report.id}`
      : `${window.location.origin}/review/${report.id}`;

  useEffect(() => {
    if (hasLogged.current) {
      return;
    }

    hasLogged.current = true;

    void fetch(`/api/reports/${report.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: "applicant",
        action: "applicant_viewed_profile",
        detail: "Applicant opened the generated profile dashboard.",
      }),
    })
      .then((response) => response.json())
      .then((next) => setReport(next))
      .catch(() => undefined);
  }, [report.id]);

  async function submitDispute() {
    if (!explanation.trim()) {
      return;
    }

    const response = await fetch(`/api/reports/${report.id}/disputes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field,
        explanation,
      }),
    });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as ProfileSummary;
    setReport(next);
    setExplanation("");
  }

  async function toggleShare(status: "active" | "revoked") {
    const response = await fetch(`/api/reports/${report.id}/consents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "report_share",
        status,
      }),
    });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as ProfileSummary;
    setReport(next);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("Reviewer link copied");
      window.setTimeout(() => setCopyState("Copy reviewer link"), 1800);
    } catch {
      setCopyState("Copy failed");
      window.setTimeout(() => setCopyState("Copy reviewer link"), 1800);
    }
  }

  return (
    <div className="page-shell">
      <RecommendationBanner report={report} />

      <section className="section-grid">
        <div className="section-main stack-lg">
          <article className="card stack-md">
            <div className="row row--space-start row--top">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Share controls</span>
                <h2>Applicant-visible sharing and revocation</h2>
              </div>
              <BandPill
                tone={shareConsent?.status === "active" ? "Verified" : "Missing"}
              >
                {shareConsent?.status === "active" ? "Reviewer access live" : "Share revoked"}
              </BandPill>
            </div>
            <p className="body-muted">
              Credora keeps reviewer access time-bound and revocable. The applicant
              sees the same summary and reason codes that the reviewer sees.
            </p>
            <div className="button-row">
              <button className="button button--secondary" onClick={copyShareLink} type="button">
                {copyState}
              </button>
              <Link className="button button--ghost" href={`/review/${report.id}`}>
                Open reviewer dashboard
              </Link>
              {shareConsent?.status === "active" ? (
                <button
                  className="button button--ghost"
                  onClick={() => void toggleShare("revoked")}
                  type="button"
                >
                  Revoke reviewer access
                </button>
              ) : (
                <button
                  className="button button--secondary"
                  onClick={() => void toggleShare("active")}
                  type="button"
                >
                  Restore reviewer access
                </button>
              )}
            </div>
          </article>

          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Explainability</span>
                <h2>Category breakdown</h2>
              </div>
            </div>
            <div className="card-grid">
              {report.categories.map((category) => (
                <CategoryCard key={category.key} category={category} />
              ))}
            </div>
          </section>

          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Evidence panel</span>
                <h2>What was actually used</h2>
              </div>
            </div>
            <div className="card-grid">
              {report.evidence.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Dispute flow</span>
                <h2>Report an error or add context</h2>
              </div>
            </div>
            <article className="card stack-md">
              <p className="body-muted">
                This is where an applicant can challenge inaccurate, incomplete, or
                irrelevant records before any adverse action is taken.
              </p>
              <div className="form-grid">
                <label className="field">
                  <span>Evidence area</span>
                  <select value={field} onChange={(event) => setField(event.target.value)}>
                    <option>income support</option>
                    <option>housing history</option>
                    <option>identity verification</option>
                    <option>bank connection</option>
                    <option>report narrative</option>
                  </select>
                </label>
                <label className="field field--wide">
                  <span>What should be corrected or reviewed?</span>
                  <textarea
                    rows={4}
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="button button--primary"
                disabled={isPending}
                onClick={() => startTransition(() => void submitDispute())}
                type="button"
              >
                {isPending ? "Submitting dispute..." : "Submit dispute"}
              </button>
            </article>
            {report.disputes.length > 0 ? (
              <div className="card-grid">
                {report.disputes.map((dispute) => (
                  <article key={dispute.id} className="card stack-sm">
                    <div className="row row--space-start">
                      <div className="stack-xs">
                        <span className="eyebrow eyebrow--subtle">{dispute.field}</span>
                        <h3>Dispute is {dispute.status.replace("_", " ")}</h3>
                      </div>
                      <BandPill tone="Needs manual review">{dispute.status}</BandPill>
                    </div>
                    <p className="body-muted">{dispute.explanation}</p>
                    <small>Opened {formatDateTime(dispute.createdAt)}</small>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="section-side stack-md">
          <article className="card stack-md sticky-card">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Top drivers</span>
              <h2>What is helping this profile</h2>
            </div>
            <div className="chip-group">
              {report.topDrivers.map((driver) => (
                <span key={driver} className="chip chip--soft">
                  {driver}
                </span>
              ))}
            </div>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">Missing evidence</span>
              <ul className="list">
                {report.missingEvidence.length > 0 ? (
                  report.missingEvidence.map((entry) => <li key={entry}>{entry}</li>)
                ) : (
                  <li>No major evidence gaps were detected.</li>
                )}
              </ul>
            </div>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">Risk flags</span>
              <ul className="list">
                {report.riskFlags.length > 0 ? (
                  report.riskFlags.map((flag) => <li key={flag}>{flag}</li>)
                ) : (
                  <li>No active risk flags.</li>
                )}
              </ul>
            </div>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Consent receipts</span>
              <h2>Source-level permissions</h2>
            </div>
            <div className="stack-sm">
              {report.consent.map((grant) => (
                <ConsentCard key={grant.id} grant={grant} />
              ))}
            </div>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Audit trail</span>
              <h2>Access and actions</h2>
            </div>
            <ul className="timeline">
              {report.accessLogs.slice(0, 8).map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.action.replaceAll("_", " ")}</strong>
                  <p>{entry.detail}</p>
                  <small>{formatDateTime(entry.at)}</small>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
