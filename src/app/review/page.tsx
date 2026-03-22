import Link from "next/link";

import { Logo } from "@/components/logo";
import { formatDate } from "@/lib/format";
import { listPublishedSnapshots } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PublishedDirectoryPage() {
  const snapshots = await listPublishedSnapshots();

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
          </nav>
        </div>
      </header>

      <div style={{ borderBottom: "1px solid var(--border)", width: "100%" }}>
        <div className="page-shell" style={{ padding: "2rem 0 1.75rem" }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: "0.4rem" }}>
            Published Snapshots
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              maxWidth: "none",
              marginBottom: "0.5rem",
              lineHeight: 1.05,
            }}
          >
            Public Profiles
          </h1>
          <p className="body-muted">
            View finalized public profile versions. Each snapshot is immutable and newer
            publishes create a linked next version instead of overwriting history.
          </p>
        </div>
      </div>

      <main className="page-shell">
        <div className="stack-lg">
          {snapshots.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <p className="body-muted">No public snapshots have been published yet.</p>
            </div>
          ) : (
            <div className="applicant-tile-grid">
              {snapshots.map((snapshot) => {
                const score = snapshot.overallScore ?? null;
                const ringColor =
                  score === null
                    ? "var(--text-soft)"
                    : score >= 75
                      ? "var(--positive)"
                      : score >= 55
                        ? "var(--balanced)"
                        : "var(--caution)";

                return (
                  <Link key={snapshot.id} href={`/published/${snapshot.id}`} className="applicant-tile">
                    <div
                      className="applicant-tile__score-ring"
                      style={{
                        background:
                          score !== null
                            ? `conic-gradient(${ringColor} 0% ${score}%, var(--ring-track) ${score}% 100%)`
                            : "var(--ring-track)",
                      }}
                    >
                      <div className="applicant-tile__score-inner">
                        <span className="applicant-tile__score-num" style={{ color: ringColor }}>
                          {score ?? "--"}
                        </span>
                        {score !== null ? (
                          <span className="applicant-tile__score-denom">/100</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="applicant-tile__info">
                      <span className="applicant-tile__name">{snapshot.applicantName}</span>
                      <span className="applicant-tile__date">{formatDate(snapshot.publishedAt)}</span>
                    </div>

                    <span className="applicant-tile__cta">Open public profile -&gt;</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
