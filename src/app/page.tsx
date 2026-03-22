import Link from "next/link";
import { auth0 } from "@/auth";

import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

const MOCKUP_CATEGORIES = [
  { label: "Payment consistency", score: "88", pct: "88%", color: "#059669", delay: "0.4s" },
  { label: "Income regularity",   score: "81", pct: "81%", color: "#059669", delay: "0.6s" },
  { label: "Housing history",     score: "74", pct: "74%", color: "#2563eb", delay: "0.8s" },
  { label: "Balance stability",   score: "67", pct: "67%", color: "#d97706", delay: "1.0s" },
];

export default async function HomePage() {
  const session = await auth0.getSession();
  const isLoggedIn = !!session;

  return (
    <>
      {/* ── Sticky navbar ──────────────────────────────────── */}
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <Logo size={32} />
            <span>Credora</span>
          </Link>
          <nav className="site-nav">
            {(!isLoggedIn || ((session?.user?.["https://credora.app/roles"] as string[]) ?? []).includes("applicant")) && (
              <Link href="/applicant">For applicants</Link>
            )}
            {(!isLoggedIn || ((session?.user?.["https://credora.app/roles"] as string[]) ?? []).includes("reviewer")) && (
              <Link href="/review">Reviewer Portal</Link>
            )}
          </nav>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {isLoggedIn ? (
              <a className="button button--ghost" href="/auth/logout" style={{ height: "36px", padding: "0 1rem" }}>
                Sign out ({session.user?.name ?? session.user?.email})
              </a>
            ) : (
              <>
                <a className="button button--ghost" href="/auth/login" style={{ height: "36px", padding: "0 1rem" }}>
                  Sign in
                </a>
                <a className="button button--primary" href="/auth/login" style={{ height: "36px", padding: "0 1rem" }}>
                  Get started
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Full-width hero ────────────────────────────────── */}
      <section className="landing-hero">
        <div className="marketing-shell">
          <div className="landing-hero-grid">

            {/* Left: copy */}
            <div className="landing-hero-left">
              <h1>Comprehensive Reliability Profiling.</h1>

              <p className="lede">
                Credora securely transforms consented financial and housing data into an actionable reliability profile. We empower property managers with transparent insights and applicants with a holistic financial identity.
              </p>

              <div className="button-row">
                <Link className="button button--primary" href="/applicant">
                  Build your profile
                </Link>
                <Link className="button button--secondary" href="/review">
                  Reviewer Portal
                </Link>
              </div>
            </div>

            {/* Right: animated product mockup */}
            <div className="hero-mockup-wrapper">
              <div className="hero-mockup-back" />
              <div className="hero-mockup-card">
                <div className="hero-mockup-header">
                  <div>
                    <div className="hero-mockup-tag">Reliability profile</div>
                    <div className="hero-mockup-name">Jordan Rivera</div>
                    <div className="hero-mockup-pill">Recommended for approval</div>
                  </div>
                  <div className="hero-mockup-ring">
                    <div className="hero-mockup-ring-inner">
                      <span className="hero-mockup-score-num">82</span>
                      <span className="hero-mockup-score-denom">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="hero-mockup-categories">
                  {MOCKUP_CATEGORIES.map((cat) => (
                    <div key={cat.label} className="hero-mockup-cat">
                      <div className="hero-mockup-cat-row">
                        <span className="hero-mockup-cat-label">{cat.label}</span>
                        <span className="hero-mockup-cat-score">{cat.score}</span>
                      </div>
                      <div className="hero-mockup-bar">
                        <div
                          className="hero-mockup-bar-fill"
                          style={{
                            width: cat.pct,
                            background: cat.color,
                            animationDelay: cat.delay,
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

      {/* ── Rest of page ───────────────────────────────────── */}
      <div className="marketing-shell">


        {/* How it works */}
        <div className="steps-section">
          <div style={{ marginBottom: "1.75rem" }}>
            <div className="section-eyebrow">How it works</div>
            <div className="section-title">Three steps to a verified profile</div>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Build your profile</h3>
              <p>
                Connect your bank, upload pay stubs, and share housing history
                through a consent-first flow.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Get your score</h3>
              <p>
                Credora analyses payment consistency, income stability, and
                identity to produce a transparent, explainable reliability score.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Share with reviewers</h3>
              <p>
                Send a time-bound link to your landlord. Revoke access at any
                time. No hidden back doors.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: "0.5rem 0 2rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <div className="section-eyebrow">Platform features</div>
            <div className="section-title">Built for transparency on both sides</div>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>
                    <path d="M8.5 8.5 A5 5 0 0 1 17 12 A5 5 0 0 1 12 17"/>
                    <path d="M5.5 5.5 A9 9 0 0 1 21 12 A9 9 0 0 1 12 21"/>
                    <path d="M3 12 A9 9 0 0 1 7.8 4"/>
                  </svg>
                ),
                title: "Identity confidence",
                body: "Verify identity and confirm bank account ownership before any signal reaches a reviewer.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 19 H6 V15 H10 V11 H14 V7 H18 V4"/>
                    <circle cx="3"  cy="19" r="1.6" fill="currentColor" stroke="none"/>
                    <circle cx="6"  cy="15" r="1.6" fill="currentColor" stroke="none"/>
                    <circle cx="10" cy="11" r="1.6" fill="currentColor" stroke="none"/>
                    <circle cx="14" cy="7"  r="1.6" fill="currentColor" stroke="none"/>
                    <circle cx="18" cy="4"  r="1.6" fill="currentColor" stroke="none"/>
                  </svg>
                ),
                title: "Payment continuity",
                body: "Surface rent and utility streaks from real bank-derived cash-flow patterns. Not just credit age.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <rect x="4" y="2" width="16" height="20" rx="2"/>
                    <line x1="8" y1="8"  x2="16" y2="8"/>
                    <line x1="8" y1="12" x2="14" y2="12"/>
                    <line x1="8" y1="16" x2="11" y2="16"/>
                    <circle cx="17" cy="16" r="2.5"/>
                    <path d="M19 18 L21.5 20.5" strokeWidth="2"/>
                  </svg>
                ),
                title: "Full explainability",
                body: "Every category has a score, rationale, and driver list. No black boxes, no hidden signals.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <circle cx="9"  cy="12" r="6"/>
                    <circle cx="15" cy="12" r="6"/>
                    <path d="M12 7.8 A6 6 0 0 1 12 16.2 A6 6 0 0 1 12 7.8" fill="currentColor" fillOpacity="0.25" stroke="none"/>
                    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
                  </svg>
                ),
                title: "Consent by design",
                body: "Each data source requires explicit consent. Applicants see exactly what reviewers see.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="4" cy="12" r="1.8" fill="currentColor" stroke="none"/>
                    <path d="M5.8 12 Q8 7 12 7"/>
                    <path d="M5.8 12 Q8 17 12 17"/>
                    <path d="M12 7  Q16 7  18 12"/>
                    <path d="M12 17 Q16 17 18 12"/>
                    <circle cx="18" cy="12" r="1.8" fill="currentColor" stroke="none"/>
                    <line x1="20" y1="8" x2="20" y2="16"/>
                    <path d="M20 8 L23 9.5 L20 11"/>
                  </svg>
                ),
                title: "Dispute path built in",
                body: "Challenge any inaccurate signal before adverse action is taken, with a structured escalation flow.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <circle cx="9" cy="9" r="4" />
                    <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/>
                    <path d="M13 13 L20 20"/>
                    <line x1="17" y1="17" x2="19" y2="15"/>
                    <line x1="19.5" y1="20" x2="21.5" y2="18"/>
                    <path d="M6 2 A8 8 0 0 0 2 9" strokeDasharray="2 2"/>
                    <path d="M12 2 A8 8 0 0 1 16 9" strokeDasharray="2 2"/>
                  </svg>
                ),
                title: "Revocable sharing",
                body: "Time-bound reviewer access that the applicant can revoke instantly. Full audit trail on both sides.",
              },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <h2>Ready to build your profile?</h2>
          <p>Complete your profile efficiently. Our specialists review every application to ensure precision and fairness—without automated denials.</p>
          <div className="button-row">
            <Link className="button button--white" href="/applicant">
              Build applicant profile
            </Link>
            <Link className="button button--white-outline" href="/review">
              Access Reviewer Portal
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2rem 0",
          borderTop: "1px solid var(--border)",
          marginTop: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div className="brand" style={{ fontSize: "0.95rem" }}>
            <Logo size={32} />
            <span>Credora</span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>
            Consent-based housing trust · Housing screening only · No automated denials
          </p>
        </footer>

      </div>
    </>
  );
}
