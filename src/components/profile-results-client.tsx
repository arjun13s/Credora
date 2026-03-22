"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { BandPill } from "@/components/band-pill";
import { CategoryCard } from "@/components/category-card";
import { ConsentCard } from "@/components/consent-card";
import { EvidenceCard } from "@/components/evidence-card";
import { Logo } from "@/components/logo";
import { RecommendationBanner } from "@/components/recommendation-banner";
import { formatDateTime } from "@/lib/format";
import type { PublishProfileResponse } from "@/lib/api-contracts";
import type { ApplicantProfileView } from "@/lib/types";

export function ProfileResultsClient({ initialView }: { initialView: ApplicantProfileView }) {
  const [view, setView] = useState(initialView);
  const [field, setField] = useState("housing history");
  const [explanation, setExplanation] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
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

  async function publishProfile() {
    if (
      !window.confirm(
        "Publishing will create a permanent public snapshot of this scored profile. Anyone with the public URL will be able to access this version. This cannot be undone. Continue?",
      )
    ) {
      return;
    }

    setPublishError(null);
    const response = await fetch(`/api/profiles/${view.profile.id}/publish`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as PublishProfileResponse | null;

    if (response.status === 409) {
      if (payload?.view) {
        setView(payload.view);
      }
      setPublishError(
        payload?.error ??
          "This exact scored result is already public. Submit a newer scored version before publishing again.",
      );
      return;
    }

    if (!response.ok || !payload?.view) {
      setPublishError("Credora could not publish this snapshot right now. Please try again.");
      return;
    }

    setView(payload.view);
  }

  async function submitDispute() {
    setDisputeError(null);
    setDisputeSubmitted(false);
    const response = await fetch(`/api/profiles/${view.profile.id}/disputes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, explanation }),
    });

    if (!response.ok) {
      setDisputeError("Credora could not submit this dispute right now. Please try again.");
      return;
    }

    const payload = (await response.json()) as { view: ApplicantProfileView };
    setView(payload.view);
    setExplanation("");
    setDisputeSubmitted(true);
  }

  const result = view.gradingResult?.finalResult;
  const publishedPath = view.latestPublishedSnapshot
    ? `/published/${view.latestPublishedSnapshot.id}`
    : undefined;

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <Logo size={32} />
            <span>Credora</span>
          </Link>
          <nav className="site-nav">
            <Link href="/blockchain-technology">Blockchain technology</Link>
            <Link href="/applicant-profile">New profile</Link>
            <Link href="/review">Published Snapshots</Link>
          </nav>
        </div>
      </header>

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
                {isPending ? "Submitting..." : disputeSubmitted ? "Submitted!" : "Submit dispute"}
              </button>
              {disputeError ? <p className="body-muted">{disputeError}</p> : null}
            </article>
          </section>
        </div>

        <aside className="section-side stack-md">
          <article className="card stack-md sticky-card">
            <div className="stack-xs">
              <span className="eyebrow eyebrow--subtle">Publish snapshot</span>
              <h2>Make this profile public</h2>
            </div>
            <p className="body-muted">
              This profile stays private until you publish it. Publishing creates a
              permanent public snapshot that others can access and compare over time.
            </p>
            <div className="subtle-panel stack-sm">
              <span className="mini-label">Important</span>
              <p className="body-muted">
                Publishing is the only way to use this profile publicly. Anyone with the public URL
                can access the published version. Once a snapshot is published, it cannot be undone or edited.
                Later publishes create a new linked version only after a newer scored profile exists.
              </p>
            </div>
            {view.latestPublishedSnapshot ? (
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Latest published snapshot</span>
                <p className="body-muted">{publishedPath}</p>
                <small>Published {formatDateTime(view.latestPublishedSnapshot.publishedAt)}</small>
              </div>
            ) : null}
            <div className="button-row">
              <button
                className="button button--secondary"
                disabled={!view.canPublishSnapshot}
                onClick={() => void publishProfile()}
                type="button"
              >
                {view.latestPublishedSnapshot ? "Publish new scored version" : "Publish public snapshot"}
              </button>
              {view.latestPublishedSnapshot ? (
                <Link
                  className="button button--ghost"
                  href={`/published/${view.latestPublishedSnapshot.id}`}
                >
                  Open public snapshot
                </Link>
              ) : null}
            </div>
            <small className="body-muted">Cannot be undone.</small>
            {!view.canPublishSnapshot && view.latestPublishedSnapshot ? (
              <p className="body-muted">
                This exact scored result has already been published. Submit a new profile version before publishing again.
              </p>
            ) : null}
            {publishError ? <p className="body-muted">{publishError}</p> : null}
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

        </aside>
      </section>
    </div>
    </>
  );
}
