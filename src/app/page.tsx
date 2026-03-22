import Link from "next/link";
import { auth, signOut } from "@/auth";

import { listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session;
  const sampleReportId = listReports()[0]?.id ?? "";

  return (
    <div className="marketing-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">C</span>
          <span>Credora</span>
        </Link>
        <nav className="site-nav">
          {isLoggedIn ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="text-link" style={{ fontSize: "inherit" }}>
                Sign out ({session.user?.name})
              </button>
            </form>
          ) : (
            <Link href="/login" className="text-link">
              Sign in
            </Link>
          )}
          {(!isLoggedIn || (session?.user as any)?.role === "applicant") && (
            <Link href="/applicant">Applicant flow</Link>
          )}
          {(!isLoggedIn || (session?.user as any)?.role === "reviewer") && (
            <Link href={`/review/${sampleReportId}`}>Reviewer demo</Link>
          )}
        </nav>
      </header>

      <main className="page-shell">
        <section className="marketing-hero">
          <div className="stack-md">
            <span className="eyebrow">Housing-first trust infrastructure</span>
            <h1>Proof beyond the credit score.</h1>
            <p className="lede">
              Credora helps thin-file renters turn consented financial and housing
              evidence into an explainable profile landlords can review more fairly
              than a blunt credit score alone.
            </p>
            <div className="button-row">
              <Link className="button button--primary" href="/applicant">
                Build applicant profile
              </Link>
              <Link className="button button--secondary" href={`/review/${sampleReportId}`}>
                Open reviewer dashboard
              </Link>
            </div>
          </div>

          <div className="hero-side stack-md">
            <article className="hero-card stack-md">
              <span className="mini-label">What Credora is</span>
              <ul className="list">
                <li>Consent-based and user-visible</li>
                <li>Explainable, category-by-category</li>
                <li>Built for manual review, not automated denial</li>
              </ul>
            </article>
            <article className="subtle-panel stack-sm">
              <span className="mini-label">What Credora is not</span>
              <ul className="list">
                <li>Not a universal reputation score</li>
                <li>Not employment or criminal screening in v1</li>
                <li>Not hidden surveillance or behavioral profiling</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="feature-grid">
          <article className="card stack-sm">
            <span className="eyebrow eyebrow--subtle">Identity confidence</span>
            <h2>Verify who is applying</h2>
            <p className="body-muted">
              Confirm identity and account-owner match before any reliability signal
              is shown to a reviewer.
            </p>
          </article>
          <article className="card stack-sm">
            <span className="eyebrow eyebrow--subtle">Payment behavior</span>
            <h2>Show real payment continuity</h2>
            <p className="body-muted">
              Use bank-derived cash-flow patterns plus rent evidence to surface
              housing-relevant behavior.
            </p>
          </article>
          <article className="card stack-sm">
            <span className="eyebrow eyebrow--subtle">Transparency</span>
            <h2>Let applicants see and challenge the result</h2>
            <p className="body-muted">
              Every negative signal gets a source, a reason, and a dispute path.
            </p>
          </article>
        </section>

        <section className="marketing-columns">
          <article className="card stack-md">
            <span className="eyebrow eyebrow--subtle">Why legacy checks fail</span>
            <h2>Thin-file does not mean high risk.</h2>
            <ul className="list">
              <li>Credit files often miss strong real-world payment behavior.</li>
              <li>Newcomers, students, and gig workers are routinely underrepresented.</li>
              <li>Opaque screening creates confusion and difficult disputes.</li>
            </ul>
          </article>
          <article className="card stack-md">
            <span className="eyebrow eyebrow--subtle">Boundaries by design</span>
            <h2>Purpose-limited from the first screen.</h2>
            <ul className="list">
              <li>Housing-only framing in the MVP</li>
              <li>No hidden social or behavioral signals</li>
              <li>No black-box machine learning in the scoring engine</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
