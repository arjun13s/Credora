import { Check, X } from "lucide-react";
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
    default:
      return source;
  }
}

export function ConsentCard({ grant }: { grant: ConsentRecord }) {
  const isActive = grant.status === "active";

  return (
    <article className="card stack-sm">
      <div className="row row--space-start">
        <div className="stack-xs">
          <span className="eyebrow eyebrow--subtle">{grant.source.replaceAll("_", " ")}</span>
          <h3>{consentTitle(grant.source)}</h3>
        </div>
        {isActive ? (
          <Check size={18} style={{ color: "var(--positive)", flexShrink: 0 }} />
        ) : (
          <X size={18} style={{ color: "var(--caution)", flexShrink: 0 }} />
        )}
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
