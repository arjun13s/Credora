"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { BandPill } from "@/components/band-pill";
import { CategoryCard } from "@/components/category-card";
import { EvidenceCard } from "@/components/evidence-card";
import { RecommendationBanner } from "@/components/recommendation-banner";
import { formatDateTime } from "@/lib/format";
import type { ProfileSummary, ReviewDisposition } from "@/lib/types";

export function ReviewerPageClient({
  initialReport,
}: {
  initialReport: ProfileSummary;
}) {
  const [report, setReport] = useState(initialReport);
  const [reviewerName, setReviewerName] = useState("Avery from Harbor PM");
  const [disposition, setDisposition] = useState<ReviewDisposition>(
    "Proceed to manual approval review",
  );
  const [notes, setNotes] = useState(
    "Profile is directionally strong. Proceed with the usual lease review and document checks.",
  );
  const [isPending, startTransition] = useTransition();
  const hasLogged = useRef(false);

  const shareConsent = report.consent.find((grant) => grant.source === "report_share");
  const shareActive = shareConsent?.status === "active";

  useEffect(() => {
    if (hasLogged.current) {
      return;
    }

    hasLogged.current = true;

    void fetch(`/api/reports/${report.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: "reviewer",
        action: "reviewer_opened_profile",
        detail: "Reviewer opened the shared housing profile.",
      }),
    })
      .then((response) => response.json())
      .then((next) => setReport(next))
      .catch(() => undefined);
  }, [report.id]);

  async function submitReview() {
    const response = await fetch(`/api/reports/${report.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerName,
        disposition,
        notes,
      }),
    });

    if (!response.ok) {
      return;
    }

    const next = (await response.json()) as ProfileSummary;
    setReport(next);
  }

  return (
    <div className="page-shell">
      <RecommendationBanner report={report} />

      {!shareActive ? (
        <section className="card stack-md blocked-banner">
          <span className="eyebrow">Access revoked</span>
          <h2>The applicant has revoked reviewer access to this report.</h2>
          <p className="body-muted">
            Credora does not keep hidden back doors. Once access is revoked, the
            reviewer should request renewed consent from the applicant.
          </p>
          <Link className="button button--secondary" href={`/profile/${report.id}`}>
            Return to applicant view
          </Link>
        </section>
      ) : null}

      <section className="section-grid">
        <div className="section-main stack-lg">
          <article className="card stack-md">
            <div className="row row--space-start row--top">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Reviewer guidance</span>
                <h2>Soft recommendation, not automated approval</h2>
              </div>
              <BandPill tone={report.recommendation}>{report.recommendation}</BandPill>
            </div>
            <p className="body-muted">
              Use this report to structure manual review. Credora does not support
              fully automated rental denials, deposit pricing, or employment screening.
            </p>
          </article>

          {shareActive ? (
            <>
              <section className="stack-md">
                <div className="section-header">
                  <div>
                    <span className="eyebrow eyebrow--subtle">Category view</span>
                    <h2>Explainable reliability categories</h2>
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
                    <span className="eyebrow eyebrow--subtle">Evidence</span>
                    <h2>Shared supporting signals</h2>
                  </div>
                </div>
                <div className="card-grid">
                  {report.evidence.map((item) => (
                    <EvidenceCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>

        <aside className="section-side stack-md">
          <article className="card stack-md sticky-card">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Reviewer action</span>
              <h2>Record a manual note</h2>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Reviewer name</span>
                <input
                  value={reviewerName}
                  onChange={(event) => setReviewerName(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Disposition</span>
                <select
                  value={disposition}
                  onChange={(event) =>
                    setDisposition(event.target.value as ReviewDisposition)
                  }
                >
                  <option>Proceed to manual approval review</option>
                  <option>Needs more information</option>
                  <option>Continue manual review</option>
                </select>
              </label>
              <label className="field field--wide">
                <span>Notes for the applicant-visible audit trail</span>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
            </div>
            <button
              className="button button--primary"
              disabled={isPending || !shareActive}
              onClick={() => startTransition(() => void submitReview())}
              type="button"
            >
              {isPending ? "Saving note..." : "Save reviewer note"}
            </button>
            {report.reviewerAction ? (
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Latest recorded note</span>
                <BandPill tone={report.reviewerAction.disposition}>
                  {report.reviewerAction.disposition}
                </BandPill>
                <p>{report.reviewerAction.notes}</p>
                <small>{formatDateTime(report.reviewerAction.createdAt)}</small>
              </div>
            ) : null}
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Flags and gaps</span>
              <h2>What still needs a human decision</h2>
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
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Audit log</span>
              <h2>Shared access trail</h2>
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
