"use client";

import { useState, useTransition } from "react";

import { BandPill } from "@/components/band-pill";
import { CategoryCard } from "@/components/category-card";
import { EvidenceCard } from "@/components/evidence-card";
import type { ApplicantProfileView, ReviewerProfileView } from "@/lib/types";

export function ReviewerProfileClient({
  initialReviewerView,
  initialApplicantView,
}: {
  initialReviewerView: ReviewerProfileView;
  initialApplicantView?: ApplicantProfileView;
}) {
  const [note, setNote] = useState(
    "Profile is useful for manual review, but should not replace standard housing diligence.",
  );
  const [reviewerName, setReviewerName] = useState("Avery from Harbor PM");
  const [disposition, setDisposition] = useState<"Manual review advised" | "Need more documents" | "Proceed carefully">(
    "Manual review advised",
  );
  const [isPending, startTransition] = useTransition();
  const [savedNote, setSavedNote] = useState<string | null>(null);

  async function saveReviewerNote() {
    if (!initialApplicantView) {
      return;
    }

    const response = await fetch(`/api/profiles/${initialApplicantView.profile.id}/reviewer-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerName,
        note,
        disposition,
      }),
    });

    if (!response.ok) {
      return;
    }

    setSavedNote(`${disposition} saved for ${reviewerName}.`);
  }

  const result = initialReviewerView.gradingResult?.finalResult;

  return (
    <div className="page-shell">
      <section className="hero-card stack-md">
        <div className="row row--space-start row--top">
          <div className="stack-sm">
            <span className="eyebrow">Reviewer preview</span>
            <h1>{initialReviewerView.applicantName}</h1>
            <p className="lede">
              This is the applicant-controlled reviewer view for a housing-specific
              profile. It is designed to support manual review, not replace it.
            </p>
          </div>
          <div className="score-panel">
            <strong className="hero-score">{result?.overallScore ?? "--"}</strong>
            <BandPill tone={result?.recommendationStatus ?? "Needs manual review"}>
              {result?.recommendationStatus ?? "Needs manual review"}
            </BandPill>
          </div>
        </div>
        <div className="chip-group">
          <BandPill tone={result?.confidence ?? "Low"}>
            {result?.confidence ?? "Low"} confidence
          </BandPill>
          <BandPill tone={initialReviewerView.profileStatus}>
            {initialReviewerView.profileStatus.replaceAll("_", " ")}
          </BandPill>
        </div>
        <p className="body-strong">{result?.summary}</p>
      </section>

      <section className="section-grid">
        <div className="section-main stack-lg">
          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Category bands</span>
                <h2>Reviewer-visible context</h2>
              </div>
            </div>
            <div className="card-grid">
              {result?.categoryAssessments.map((category) => (
                <CategoryCard key={category.key} category={category} />
              ))}
            </div>
          </section>

          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Evidence summary</span>
                <h2>Shared supporting evidence</h2>
              </div>
            </div>
            <div className="card-grid">
              {initialReviewerView.evidence.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </div>

        <aside className="section-side stack-md">
          <article className="card stack-md sticky-card">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Manual review note</span>
              <h2>Reviewer guidance</h2>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Reviewer name</span>
                <input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} />
              </label>
              <label className="field">
                <span>Disposition</span>
                <select
                  value={disposition}
                  onChange={(event) =>
                    setDisposition(
                      event.target.value as "Manual review advised" | "Need more documents" | "Proceed carefully",
                    )
                  }
                >
                  <option>Manual review advised</option>
                  <option>Need more documents</option>
                  <option>Proceed carefully</option>
                </select>
              </label>
              <label className="field field--wide">
                <span>Reviewer note</span>
                <textarea rows={5} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
            </div>
            {initialApplicantView ? (
              <button
                className="button button--primary"
                disabled={isPending}
                onClick={() => startTransition(() => void saveReviewerNote())}
                type="button"
              >
                {isPending ? "Saving..." : "Save reviewer note"}
              </button>
            ) : null}
            {savedNote ? <div className="subtle-panel">{savedNote}</div> : null}
            <div className="subtle-panel stack-sm">
              <span className="mini-label">Boundary</span>
              <p className="body-muted">
                This reviewer view intentionally hides raw transaction data and never claims to automate an approval or denial.
              </p>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
