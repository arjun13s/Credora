import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="card stack-md blocked-banner">
        <span className="eyebrow">Report not found</span>
        <h1>This Credora link is missing or expired.</h1>
        <p className="body-muted">
          The report may have expired, been revoked, or never been generated in the
          current demo session.
        </p>
        <div className="button-row">
          <Link className="button button--primary" href="/applicant">
            Build a new profile
          </Link>
          <Link className="button button--secondary" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
