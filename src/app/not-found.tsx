import Link from "next/link";

import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <Logo size={32} />
            <span>Credora</span>
          </Link>
        </div>
      </header>
      <div className="page-shell">
        <section className="card stack-md blocked-banner" style={{ maxWidth: "540px" }}>
          <span className="eyebrow eyebrow--subtle">404: Report not found</span>
          <h2>This Credora link is missing or expired.</h2>
          <p className="body-muted">
            The report may have expired, been revoked, or never been generated in the
            current demo session.
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/applicant">
              Build a new profile
            </Link>
            <Link className="button button--ghost" href="/">
              Return home
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
