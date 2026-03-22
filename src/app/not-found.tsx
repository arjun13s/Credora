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
      <main className="page-shell">
        <section className="card stack-md blocked-banner" style={{ maxWidth: "540px" }}>
          <span className="eyebrow eyebrow--subtle">404: profile not found</span>
          <h2>This Credora profile or published snapshot could not be found.</h2>
          <p className="body-muted">
            The profile may not exist, or the published snapshot may have been requested
            with the wrong identifier.
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/applicant-profile">
              Build a new profile
            </Link>
            <Link className="button button--ghost" href="/">
              Return home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
