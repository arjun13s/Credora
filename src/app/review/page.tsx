import Link from "next/link";
import { auth, signOut } from "@/auth";

import { listReports } from "@/lib/db";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function ReviewerDashboardPage() {
  const session = await auth();
  const isLoggedIn = !!session;

  const reports = listReports();

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <Logo size={32} />
            <span>Credora</span>
          </Link>
          <nav className="site-nav">
            <Link href="/">← Home</Link>
          </nav>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {isLoggedIn ? (
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button type="submit" className="button button--ghost" style={{ height: "36px", padding: "0 1rem" }}>
                  Sign out ({session.user?.name})
                </button>
              </form>
            ) : (
              <Link className="button button--primary" href="/login" style={{ height: "36px", padding: "0 1rem" }}>
                Sign in
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div style={{ borderBottom: "1px solid var(--border)", width: "100%" }}>
        <div className="page-shell" style={{ padding: "2rem 0 1.75rem" }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: "0.4rem" }}>
            Reviewer Portal
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", maxWidth: "none", marginBottom: "0.5rem", lineHeight: 1.05 }}>
            Applicant Assessments
          </h1>
          <p className="body-muted">
            View and evaluate submitted reliability profiles.
          </p>
        </div>
      </div>

      <div className="page-shell">
        <div className="stack-lg">
          {reports.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <p className="body-muted">No applicant profiles have been submitted yet.</p>
            </div>
          ) : (
            <div className="applicant-tile-grid">
              {reports.map((report) => {
                const score = report.overallScore ?? null;
                const scoreColor =
                  score === null ? "var(--text-soft)"
                  : score >= 75 ? "var(--positive)"
                  : score >= 55 ? "var(--balanced)"
                  : "var(--caution)";

                const statusClass =
                  report.reviewerAction
                    ? "status-tag--positive"
                    : "status-tag--neutral";

                return (
                  <Link
                    key={report.id}
                    href={`/review/${report.id}`}
                    className="applicant-tile"
                  >
                    <div
                      className="applicant-tile__score-ring"
                      style={{
                        background: score !== null
                          ? `conic-gradient(${scoreColor} 0% ${score}%, var(--ring-track) ${score}% 100%)`
                          : "var(--ring-track)",
                      }}
                    >
                      <div className="applicant-tile__score-inner">
                        <span className="applicant-tile__score-num" style={{ color: scoreColor }}>
                          {score ?? "—"}
                        </span>
                        {score !== null && (
                          <span className="applicant-tile__score-denom">/100</span>
                        )}
                      </div>
                    </div>

                    <div className="applicant-tile__info">
                      <span className="applicant-tile__name">{report.applicantName}</span>
                      <span className={`status-tag ${statusClass}`}>
                        {report.reviewerAction ? "Reviewed" : "Pending evaluation"}
                      </span>
                      <span className="applicant-tile__date">
                        {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <span className="applicant-tile__cta">View profile →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
