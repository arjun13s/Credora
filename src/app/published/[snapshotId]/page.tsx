import Link from "next/link";
import { notFound } from "next/navigation";

import { BandPill } from "@/components/band-pill";
import { Logo } from "@/components/logo";
import { formatDateTime } from "@/lib/format";
import { getPublishedSnapshotView } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PublishedSnapshotPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = await params;
  const snapshot = await getPublishedSnapshotView(snapshotId);

  if (!snapshot) {
    notFound();
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
            <Link href="/">Home</Link>
            <Link href="/blockchain-technology">Blockchain technology</Link>
            <Link href="/applicant-profile">Applicant Profile</Link>
            <Link href="/review">Published Snapshots</Link>
          </nav>
        </div>
      </header>

      <div className="page-shell">
        <section className="hero-card stack-md">
          <div className="row row--space-start row--top">
            <div className="stack-sm">
              <span className="eyebrow">Published Snapshot</span>
              <h1>{snapshot.applicantName}</h1>
              <p className="lede">
                This is a public, immutable Credora snapshot. It represents the exact
                scored profile the applicant chose to publish at a specific moment in time.
              </p>
            </div>
            <div className="score-panel">
              <span className="score-kicker">Public version</span>
              <strong className="hero-score">{snapshot.overallScore ?? "--"}</strong>
              <BandPill tone={snapshot.confidence}>{snapshot.confidence} confidence</BandPill>
            </div>
          </div>
          <div className="chip-group">
            <BandPill tone={snapshot.recommendationStatus}>{snapshot.recommendationStatus}</BandPill>
            <BandPill tone={snapshot.overallBand}>{snapshot.overallBand} overall band</BandPill>
            <span className="chip chip--outline">Version {snapshot.versionNumber}</span>
            <span className="chip chip--outline">
              {snapshot.isLatestVersion ? "Latest public version" : "Superseded by a newer version"}
            </span>
            <span className="chip chip--outline">Published {formatDateTime(snapshot.publishedAt)}</span>
          </div>
          <p className="body-strong">{snapshot.summary}</p>
        </section>

        <section className="section-grid">
          <div className="section-main stack-lg">
            <section className="stack-md">
              <div className="section-header">
                <div>
                  <span className="eyebrow eyebrow--subtle">Public category bands</span>
                  <h2>Snapshot breakdown</h2>
                </div>
              </div>
              <div className="card-grid">
                {snapshot.categoryAssessments.map((category) => (
                  <article key={category.key} className="card stack-sm">
                    <div className="row row--space-start">
                      <div className="stack-xs">
                        <span className="eyebrow eyebrow--subtle">{category.key.replaceAll("_", " ")}</span>
                        <h3>{category.title}</h3>
                      </div>
                    <div className="stack-xs align-end">
                      <BandPill tone={category.band}>{category.band}</BandPill>
                      <strong className="score-number">
                        {typeof category.score === "number" ? Math.round(category.score) : "--"}
                      </strong>
                    </div>
                  </div>
                    <p className="body-muted">
                      Public snapshots show the score band and score for this category. Detailed evidence
                      and internal reasoning stay off the public record.
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <article className="card stack-md">
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Strengths</span>
                <ul className="list">
                  {snapshot.strengths.map((entry) => <li key={entry}>{entry}</li>)}
                </ul>
              </div>
            </article>
          </div>

          <aside className="section-side stack-md">
            <article className="card stack-md sticky-card">
              <div className="stack-xs">
                <span className="eyebrow eyebrow--subtle">Integrity proof</span>
                <h2>Demo integrity preview</h2>
              </div>
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Payload hash</span>
                <p className="body-muted">{snapshot.payloadHash}</p>
              </div>
              {snapshot.previousSnapshotHash ? (
                <div className="subtle-panel stack-sm">
                  <span className="mini-label">Previous snapshot hash</span>
                  <p className="body-muted">{snapshot.previousSnapshotHash}</p>
                </div>
              ) : null}
              {snapshot.attestation ? (
                <div className="subtle-panel stack-sm">
                  <span className="mini-label">
                    {snapshot.attestation.attestationStatus === "demo"
                      ? "Demo proof token"
                      : "Attestation signature"}
                  </span>
                  <p className="body-muted">{snapshot.attestation.signature}</p>
                </div>
              ) : null}
              <div className="subtle-panel stack-sm">
                <span className="mini-label">Future blockchain anchor</span>
                <p className="body-muted">
                  This published version can later be anchored on-chain by its hash,
                  without storing the full applicant record on blockchain.
                </p>
              </div>
              {snapshot.nextSnapshotId ? (
                <Link className="button button--ghost" href={`/published/${snapshot.nextSnapshotId}`}>
                  Open newer published version
                </Link>
              ) : null}
              {snapshot.previousSnapshotId ? (
                <Link className="button button--secondary" href={`/published/${snapshot.previousSnapshotId}`}>
                  View previous published version
                </Link>
              ) : null}
            </article>
          </aside>
        </section>
      </div>
    </>
  );
}
