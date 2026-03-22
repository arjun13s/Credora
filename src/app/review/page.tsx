import Link from "next/link";
import { auth0 } from "@/auth";

import { listReports } from "@/lib/db";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function ReviewerDashboardPage() {
  const session = await auth0.getSession();
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
              <a className="button button--ghost" href="/auth/logout" style={{ height: "36px", padding: "0 1rem" }}>
                Sign out ({session.user?.name ?? session.user?.email})
              </a>
            ) : (
              <a className="button button--primary" href="/auth/login" style={{ height: "36px", padding: "0 1rem" }}>
                Sign in
              </a>
            )}
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
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "1rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Applicant Name</th>
                    <th style={{ padding: "1rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Submission Date</th>
                    <th style={{ padding: "1rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Score</th>
                    <th style={{ padding: "1rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Status</th>
                    <th style={{ padding: "1rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: 500 }}>{report.applicantName}</td>
                      <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ 
                          background: "var(--positive-soft)", 
                          color: "var(--positive)", 
                          padding: "0.25rem 0.5rem", 
                          borderRadius: "1rem", 
                          fontSize: "0.85rem", 
                          fontWeight: 600 
                        }}>
                          {report.overallScore ?? "N/A"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: report.reviewerAction ? "var(--positive)" : "var(--accent)" }} />
                          {report.reviewerAction ? "Reviewed" : "Pending Evaluation"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <Link 
                          href={`/review/${report.id}`} 
                          className="button button--ghost" 
                          style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", height: "auto" }}
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
