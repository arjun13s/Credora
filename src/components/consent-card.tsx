import { BandPill } from "@/components/band-pill";
import { formatDate } from "@/lib/format";
import type { ConsentRecord } from "@/lib/types";

function consentTitle(source: ConsentRecord["source"]) {
  switch (source) {
    case "identity_check":
      return "Identity verification consent";
    case "bank_connection":
      return "Bank connection consent";
    case "income_docs":
      return "Income document consent";
    case "housing_docs":
      return "Housing evidence consent";
    case "profile_share":
      return "Profile sharing consent";
    default:
      return source;
  }
}

export function ConsentCard({ grant }: { grant: ConsentRecord }) {
  return (
    <article className="card stack-sm">
      <div className="row row--space-start">
        <div className="stack-xs">
          <span className="eyebrow eyebrow--subtle">{grant.source}</span>
          <h3>{consentTitle(grant.source)}</h3>
        </div>
        <BandPill tone={grant.status === "active" ? "Verified" : "Missing"}>
          {grant.status === "active" ? "Active" : "Revoked"}
        </BandPill>
      </div>
      <p className="body-muted">{grant.scope}</p>
      <dl className="meta-grid">
        <div>
          <dt>Scope</dt>
          <dd>{grant.scope}</dd>
        </div>
        <div>
          <dt>Granted</dt>
          <dd>{formatDate(grant.grantedAt)}</dd>
        </div>
        <div>
          <dt>Expires</dt>
          <dd>{formatDate(grant.expiresAt)}</dd>
        </div>
      </dl>
    </article>
  );
}
