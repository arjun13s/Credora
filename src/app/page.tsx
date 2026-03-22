import Link from "next/link";

import { getSeededScenarioPreview } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const seeded = await getSeededScenarioPreview();
  const reviewerHref =
    seeded?.profileId && seeded.shareLink
      ? `/profiles/${seeded.profileId}/reviewer?token=${seeded.shareLink.token}`
      : "/applicant-profile";

  return (
    <div className="marketing-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">C</span>
          <span>Credora</span>
        </Link>
        <nav className="site-nav">
          <Link href="/applicant-profile">Applicant Profile</Link>
          <Link href={reviewerHref}>Reviewer demo</Link>
        </nav>
      </header>

      <main className="page-shell">
        <section className="marketing-hero">
          <div className="stack-md">
            <span className="eyebrow">Housing-first trust infrastructure</span>
            <h1>Proof beyond the credit score.</h1>
            <p className="lede">
              Credora helps renters submit one consent-based Applicant Profile,
              turn it into a housing-specific trust assessment, and review the
              results before sharing them with a landlord.
            </p>
            <div className="button-row">
              <Link className="button button--primary" href="/applicant-profile">
                Start Applicant Profile
              </Link>
              <Link className="button button--secondary" href={reviewerHref}>
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
            <h2>Build a credible housing application identity block</h2>
            <p className="body-muted">
              Applicants enter their information directly, add verification-ready
              evidence, and know what will count toward confidence.
            </p>
          </article>
          <article className="card stack-sm">
            <span className="eyebrow eyebrow--subtle">Grading engine</span>
            <h2>Turn submitted evidence into a transparent applicant profile</h2>
            <p className="body-muted">
              Credora organizes consented evidence into clear categories, produces
              an explainable result, and stays ready for a future external evaluator.
            </p>
          </article>
          <article className="card stack-sm">
            <span className="eyebrow eyebrow--subtle">Transparency</span>
            <h2>Let applicants see and challenge the result</h2>
            <p className="body-muted">
              Every issue gets context, every missing document lowers confidence
              instead of character, and the applicant can dispute the outcome.
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
              <li>No black-box universal person scoring</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
