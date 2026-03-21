import { BandPill } from "@/components/band-pill";
import { formatDate } from "@/lib/format";
import type { ConsentGrant } from "@/lib/types";

export function ConsentCard({ grant }: { grant: ConsentGrant }) {
  return (
    <article className="card stack-sm">
      <div className="row row--space-start">
        <div className="stack-xs">
          <span className="eyebrow eyebrow--subtle">{grant.source}</span>
          <h3>{grant.label}</h3>
        </div>
        <BandPill tone={grant.status === "active" ? "Verified" : "Missing"}>
          {grant.status === "active" ? "Active" : "Revoked"}
        </BandPill>
      </div>
      <p className="body-muted">{grant.purpose}</p>
      <dl className="meta-grid">
        <div>
          <dt>Scope</dt>
          <dd>{grant.shareScope}</dd>
        </div>
        <div>
          <dt>Retention</dt>
          <dd>{grant.retentionDays} days</dd>
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
