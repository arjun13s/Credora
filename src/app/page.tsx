import Link from "next/link";

import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

const MOCKUP_CATEGORIES = [
  { label: "Payment consistency", score: "88", pct: "88%", color: "#059669", delay: "0.4s" },
  { label: "Income regularity", score: "81", pct: "81%", color: "#059669", delay: "0.6s" },
  { label: "Housing history", score: "74", pct: "74%", color: "#2563eb", delay: "0.8s" },
  { label: "Balance stability", score: "67", pct: "67%", color: "#d97706", delay: "1.0s" },
];

export default async function HomePage() {
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
            <Link href="/applicant-profile">Applicant Profile</Link>
            <Link href="/review">Published Snapshots</Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="marketing-shell">
          <div className="landing-hero-grid">
            <div className="landing-hero-left">
              <h1>Comprehensive reliability profiling for housing decisions.</h1>
              <p className="lede">
                Credora turns consented applicant evidence into a transparent housing
                profile so renters can show reliability clearly and publish a public,
                immutable snapshot when they are ready to stand behind it.
              </p>

              <div className="button-row" style={{ marginTop: "2rem" }}>
                <Link href="/applicant-profile" className="button button--primary">
                  Build Applicant Profile
                </Link>
                <Link href="/review" className="button button--secondary">
                  View Published Snapshots
                </Link>
              </div>
            </div>

            <div className="hero-mockup-wrapper">
              <div className="hero-mockup-back" />
              <div className="hero-mockup-card">
                <div className="hero-mockup-header">
                  <div>
                    <div className="hero-mockup-tag">Applicant profile</div>
                    <div className="hero-mockup-name">Jordan Rivera</div>
                    <div className="hero-mockup-pill">Recommended for manual approval</div>
                  </div>
                  <div className="hero-mockup-ring">
                    <div className="hero-mockup-ring-inner">
                      <span className="hero-mockup-score-num">82</span>
                      <span className="hero-mockup-score-denom">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="hero-mockup-categories">
                  {MOCKUP_CATEGORIES.map((category) => (
                    <div key={category.label} className="hero-mockup-cat">
                      <div className="hero-mockup-cat-row">
                        <span className="hero-mockup-cat-label">{category.label}</span>
                        <span className="hero-mockup-cat-score">{category.score}</span>
                      </div>
                      <div className="hero-mockup-bar">
                        <div
                          className="hero-mockup-bar-fill"
                          style={{
                            width: category.pct,
                            background: category.color,
                            animationDelay: category.delay,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="marketing-shell">
        <div className="steps-section">
          <div style={{ marginBottom: "1.75rem" }}>
            <div className="section-eyebrow">How it works</div>
            <div className="section-title">Three steps to a publish-ready profile</div>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Submit your application once</h3>
              <p>Enter identity, income, housing, and financial context in one structured flow.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Generate an explainable result</h3>
              <p>Credora organizes evidence into clear categories and keeps missing evidence separate from actual risk.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Publish only when you choose</h3>
              <p>Applicants get the result first, then can publish an immutable public snapshot.</p>
            </div>
          </div>
        </div>

        <section className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">ID</div>
            <h3>Identity confidence</h3>
            <p>Separate identity verification from the rest of the profile so confidence is visible and bounded.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">$</div>
            <h3>Evidence-based scoring</h3>
            <p>Use structured evidence, deterministic rubric logic, and a future-ready evaluator boundary instead of a hidden black box.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">#</div>
            <h3>Versioned publication + blockchain readiness</h3>
            <p>Applicants keep results private until they publish an immutable public snapshot. Later updates create linked new versions.</p>
          </div>
        </section>

        <div className="cta-section">
          <h2>Build the profile first. Publish only when you are ready.</h2>
          <p>
            Credora keeps the scoring flow private until the applicant chooses to publish a public immutable version.
          </p>
          <div className="button-row" style={{ justifyContent: "center" }}>
            <Link className="button button--white" href="/applicant-profile">
              Open Applicant Profile
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
