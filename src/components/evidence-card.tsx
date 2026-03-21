import { BandPill } from "@/components/band-pill";
import { formatDate } from "@/lib/format";
import type { EvidenceItem } from "@/lib/types";

function mapVerificationTone(verification: EvidenceItem["verification"]) {
  switch (verification) {
    case "verified":
      return "Verified" as const;
    case "user_provided":
      return "User provided" as const;
    case "missing":
    default:
      return "Missing" as const;
  }
}

export function EvidenceCard({ item }: { item: EvidenceItem }) {
  const tone = mapVerificationTone(item.verification);

  return (
    <article className="card stack-sm">
      <div className="row row--space-start">
        <div className="stack-xs">
          <span className="eyebrow eyebrow--subtle">{item.category}</span>
          <h3>{item.label}</h3>
        </div>
        <BandPill tone={tone}>{tone}</BandPill>
      </div>
      <p className="body-muted">{item.detail}</p>
      <dl className="meta-grid">
        <div>
          <dt>Source</dt>
          <dd>{item.source}</dd>
        </div>
        <div>
          <dt>Shared</dt>
          <dd>{item.shareIncluded ? "Included in report" : "Hidden by default"}</dd>
        </div>
        {item.verifiedAt ? (
          <div>
            <dt>Verified</dt>
            <dd>{formatDate(item.verifiedAt)}</dd>
          </div>
        ) : null}
        {item.expiresAt ? (
          <div>
            <dt>Expires</dt>
            <dd>{formatDate(item.expiresAt)}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
