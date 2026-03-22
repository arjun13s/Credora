"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { BandPill } from "@/components/band-pill";
import { CategoryCard } from "@/components/category-card";
import { ConsentCard } from "@/components/consent-card";
import { EvidenceCard } from "@/components/evidence-card";
import { RecommendationBanner } from "@/components/recommendation-banner";
import { formatDateTime } from "@/lib/format";
import type { ApplicantProfileView } from "@/lib/types";

export function ProfileResultsClient({ initialView }: { initialView: ApplicantProfileView }) {
  const [view, setView] = useState(initialView);
  const [field, setField] = useState("housing history");
  const [explanation, setExplanation] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasLogged = useRef(false);

  useEffect(() => {
    if (hasLogged.current) {
      return;
    }

    hasLogged.current = true;
    void fetch(`/api/profiles/${view.profile.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: "applicant",
        action: "applicant_viewed_profile",
        detail: "Applicant opened the Applicant Profile results page.",
      }),
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.view) {
          setView(payload.view);
        }
      })
      .catch(() => undefined);
  }, [view.profile.id]);

  async function createShareLink() {
    const response = await fetch(`/api/profiles/${view.profile.id}/share-links`, {
      method: "POST",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { view: ApplicantProfileView };
    setView(payload.view);
  }

  async function revokeShareLinks() {
    const response = await fetch(`/api/profiles/${view.profile.id}/share-links`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { view: ApplicantProfileView };
    setView(payload.view);
  }

  async function submitDispute() {
    const response = await fetch(`/api/profiles/${view.profile.id}/disputes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, explanation }),
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { view: ApplicantProfileView };
    setView(payload.view);
    setExplanation("");
  }

  const result = view.gradingResult?.finalResult;
  const shareUrl =
    view.shareLink && typeof window !== "undefined"
      ? `${window.location.origin}/profiles/${view.profile.id}/reviewer?token=${view.shareLink.token}`
      : undefined;

  return (
    <div className="page-shell">
      <RecommendationBanner view={view} />

      <section className="section-grid">
        <div className="section-main stack-lg">
          <article className="card stack-md">
            <div className="row row--space-start row--top">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Applicant identity</span>
                <h2>{view.applicant.fullName}</h2>
              </div>
              <BandPill tone={view.profile.status}>{view.profile.status.replaceAll("_", " ")}</BandPill>
            </div>
            <dl className="meta-grid">
              <div>
                <dt>Email</dt>
                <dd>{view.applicant.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{view.applicant.phone}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {view.applicant.city}, {view.applicant.state}
                </dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDateTime(view.submission.submittedAt)}</dd>
              </div>
            </dl>
          </article>

          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Trust / Reliability Summary</span>
                <h2>How Credora assessed this housing application</h2>
              </div>
            </div>
            <article className="card stack-md">
              <div className="chip-group">
                <BandPill tone={result?.overallBand ?? "Unknown"}>
                  {result?.overallBand ?? "Unknown"} overall band
                </BandPill>
                <BandPill tone={result?.confidence ?? "Low"}>
                  {result?.confidence ?? "Low"} confidence
                </BandPill>
                <BandPill tone={result?.recommendationStatus ?? "Needs manual review"}>
                  {result?.recommendationStatus ?? "Needs manual review"}
                </BandPill>
              </div>
              <p className="body-strong">{result?.summary}</p>
            </article>
          </section>

          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Category bands</span>
                <h2>Confidence by evidence area</h2>
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
                <span className="eyebrow eyebrow--subtle">How this was calculated</span>
                <h2>Evidence and confidence notes</h2>
              </div>
            </div>
            <article className="card stack-md">
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Strengths</span>
                <ul className="list">
                  {result?.strengths.map((entry) => <li key={entry}>{entry}</li>)}
                </ul>
              </div>
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Risks / issues / missing evidence</span>
                <ul className="list">
                  {[...(result?.riskFlags ?? []), ...(result?.missingEvidence ?? [])]
                    .slice(0, 8)
                    .map((entry) => <li key={entry}>{entry}</li>)}
                </ul>
              </div>
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Confidence notes</span>
                <ul className="list">
                  {result?.confidenceNotes.map((entry) => <li key={entry}>{entry}</li>)}
                </ul>
              </div>
            </article>
            <div className="card-grid">
              {view.evidence.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section className="stack-md">
            <div className="section-header">
              <div>
                <span className="eyebrow eyebrow--subtle">Dispute and transparency</span>
                <h2>Request a correction or review</h2>
              </div>
            </div>
            <article className="card stack-md">
              <div className="form-grid">
                <label className="field">
                  <span>Issue area</span>
                  <select value={field} onChange={(event) => setField(event.target.value)}>
                    <option>housing history</option>
                    <option>identity verification</option>
                    <option>income documents</option>
                    <option>bank connection</option>
                    <option>evaluation summary</option>
                  </select>
                </label>
                <label className="field field--wide">
                  <span>What should be corrected?</span>
                  <textarea
                    rows={4}
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="button button--primary"
                disabled={isPending || !explanation.trim()}
                onClick={() => startTransition(() => void submitDispute())}
                type="button"
              >
                {isPending ? "Submitting..." : "Submit dispute"}
              </button>
            </article>
          </section>
        </div>

        <aside className="section-side stack-md">
          <article className="card stack-md sticky-card">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Share profile</span>
              <h2>Applicant-controlled sharing</h2>
            </div>
            <p className="body-muted">
              Your profile is private by default. Generate a revocable reviewer link
              only when you are ready to share it.
            </p>
            {view.shareLink ? (
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Reviewer link</span>
                <p className="body-muted">{shareUrl}</p>
                <small>Expires {formatDateTime(view.shareLink.expiresAt)}</small>
              </div>
            ) : null}
            <div className="button-row">
              <button className="button button--secondary" onClick={() => void createShareLink()} type="button">
                Generate share link
              </button>
              {view.shareLink ? (
                <>
                  <Link
                    className="button button--ghost"
                    href={`/profiles/${view.profile.id}/reviewer?token=${view.shareLink.token}`}
                  >
                    Preview reviewer view
                  </Link>
                  <button className="button button--ghost" onClick={() => void revokeShareLinks()} type="button">
                    Revoke access
                  </button>
                </>
              ) : null}
            </div>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Consent records</span>
              <h2>What you allowed Credora to use</h2>
            </div>
            <div className="stack-sm">
              {view.consents.map((consent) => (
                <ConsentCard key={consent.id} grant={consent} />
              ))}
            </div>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Future portability</span>
              <h2>Signed export hook</h2>
            </div>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">Not on blockchain in MVP</span>
              <p className="body-muted">
                Credora is future-ready for signed attestations later, but the current MVP keeps portability off-chain.
              </p>
            </div>
          </article>

          <article className="card stack-md">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Audit trail</span>
              <h2>Profile activity</h2>
            </div>
            <ul className="timeline">
              {view.auditLogs.slice(0, 8).map((entry) => (
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
