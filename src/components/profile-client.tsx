"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { BandPill } from "@/components/band-pill";
import { Logo } from "@/components/logo";
import { CategoryCard } from "@/components/category-card";
import { RecommendationBanner } from "@/components/recommendation-banner";
import type { ProfileSummary, ReviewDisposition } from "@/lib/types";

export function ProfileClient({
  initialReport,
  defaultTab = "applicant",
}: {
  initialReport: ProfileSummary;
  defaultTab?: "applicant" | "reviewer";
}) {
  const [report, setReport] = useState(initialReport);
  const [copyState, setCopyState] = useState("Copy link");
  const [reviewerName, setReviewerName] = useState("");
  const [disposition, setDisposition] = useState<ReviewDisposition>("Proceed to manual approval review");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasLogged = useRef(false);

  const shareConsent = report.consent.find((g) => g.source === "report_share");
  const shareActive = shareConsent?.status === "active";
  const shareLink =
    typeof window === "undefined"
      ? `/review/${report.id}`
      : `${window.location.origin}/review/${report.id}`;

  useEffect(() => {
    if (hasLogged.current) return;
    hasLogged.current = true;
    const isReviewer = defaultTab === "reviewer";
    void fetch(`/api/reports/${report.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: isReviewer ? "reviewer" : "applicant",
        action: isReviewer ? "reviewer_opened_profile" : "applicant_viewed_profile",
        detail: isReviewer
          ? "Reviewer opened the shared housing profile."
          : "Applicant opened the generated profile dashboard.",
      }),
    })
      .then((r) => r.json())
      .then((next) => setReport(next))
      .catch(() => undefined);
  }, [report.id, defaultTab]);

  async function toggleShare(status: "active" | "revoked") {
    const response = await fetch(`/api/reports/${report.id}/consents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "report_share", status }),
    });
    if (!response.ok) return;
    const next = (await response.json()) as ProfileSummary;
    setReport(next);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("Copied!");
      window.setTimeout(() => setCopyState("Copy link"), 1800);
    } catch {
      setCopyState("Failed");
      window.setTimeout(() => setCopyState("Copy link"), 1800);
    }
  }

  async function submitReview() {
    if (!reviewerName.trim() || !notes.trim()) return;
    const response = await fetch(`/api/reports/${report.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerName, disposition, notes }),
    });
    if (!response.ok) return;
    const next = (await response.json()) as ProfileSummary;
    setReport(next);
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
            {defaultTab === "reviewer" ? (
              <Link href="/review">← All applicants</Link>
            ) : (
              <Link href="/applicant">New profile</Link>
            )}
          </nav>
          <BandPill tone={shareActive ? "Verified" : "Missing"}>
            {shareActive ? "Access live" : "Revoked"}
          </BandPill>
        </div>
      </header>

      <div className="page-shell">
        {/* Full-width banner */}
        <RecommendationBanner report={report} />

        {!shareActive && (
          <section className="card blocked-banner" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ marginBottom: "0.4rem" }}>Reviewer access revoked</h2>
            <p className="body-muted">
              Request renewed consent from the applicant to restore access.
            </p>
          </section>
        )}

        <div className="section-grid">
          {/* ── Main: category breakdown only ─────────────────── */}
          <div className="section-main stack-lg">
            <section className="stack-md">
              <span className="eyebrow">Reliability breakdown</span>
              <div className="card-grid">
                {report.categories.map((category) => (
                  <CategoryCard key={category.key} category={category} />
                ))}
              </div>
            </section>
          </div>

          {/* ── Sidebar: signals + share + reviewer note ──────── */}
          <aside className="section-side stack-md">

            {/* Profile signals */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow--subtle">Summary</span>
                <h2>Profile signals</h2>
              </div>
              <div className="chip-group">
                {report.topDrivers.map((driver) => (
                  <span key={driver} className="chip chip--soft">{driver}</span>
                ))}
              </div>
              {report.riskFlags.length > 0 && (
                <div className="subtle-panel stack-sm">
                  <span className="mini-label">Risk flags</span>
                  <ul className="list">
                    {report.riskFlags.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              )}
              {report.missingEvidence.length > 0 && (
                <div className="subtle-panel stack-sm">
                  <span className="mini-label">Missing evidence</span>
                  <ul className="list">
                    {report.missingEvidence.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              )}
              {report.riskFlags.length === 0 && report.missingEvidence.length === 0 && (
                <p className="body-muted" style={{ fontSize: "0.85rem" }}>
                  No active flags or evidence gaps.
                </p>
              )}
            </article>

            {/* Share controls */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow--subtle">Share</span>
                <h2>Reviewer access</h2>
                <p className="body-muted">
                  Time-bound link. Revoke anytime.
                </p>
              </div>
              <div className="button-row">
                <button className="button button--primary" onClick={copyShareLink} type="button">
                  {copyState}
                </button>
                {shareActive ? (
                  <button
                    className="button button--ghost"
                    onClick={() => void toggleShare("revoked")}
                    type="button"
                  >
                    Revoke
                  </button>
                ) : (
                  <button
                    className="button button--secondary"
                    onClick={() => void toggleShare("active")}
                    type="button"
                  >
                    Restore
                  </button>
                )}
              </div>
            </article>

            {/* Reviewer note */}
            <article className="card stack-md">
              <div className="stack-xs">
                <span className="eyebrow--subtle">Reviewer</span>
                <h2>Leave a note</h2>
                <p className="body-muted">Soft recommendation only. No automated decisions.</p>
              </div>
              <label className="field">
                <span>Your name</span>
                <input
                  value={reviewerName}
                  placeholder="Reviewer name"
                  onChange={(e) => setReviewerName(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Disposition</span>
                <select
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value as ReviewDisposition)}
                >
                  <option>Proceed to manual approval review</option>
                  <option>Needs more information</option>
                  <option>Continue manual review</option>
                </select>
              </label>
              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={4}
                  value={notes}
                  placeholder="Add notes..."
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <button
                className="button button--primary"
                disabled={isPending || !shareActive}
                onClick={() => startTransition(() => void submitReview())}
                type="button"
              >
                {isPending ? "Saving..." : "Save note"}
              </button>
              {report.reviewerAction && (
                <div className="subtle-panel stack-sm">
                  <span className="mini-label">Latest note</span>
                  <BandPill tone={report.reviewerAction.disposition}>
                    {report.reviewerAction.disposition}
                  </BandPill>
                  <p className="body-muted">{report.reviewerAction.notes}</p>
                </div>
              )}
            </article>

          </aside>
        </div>
      </div>
    </>
  );
}
