import { BandPill } from "@/components/band-pill";
import type { EvidenceItem } from "@/lib/types";

function mapVerificationTone(verification: EvidenceItem["verificationState"]) {
  switch (verification) {
    case "verified":
      return "Verified" as const;
    case "self_reported":
      return "Self reported" as const;
    case "missing":
    default:
      return "Missing" as const;
  }
}

export function EvidenceCard({ item }: { item: EvidenceItem }) {
  const tone = mapVerificationTone(item.verificationState);

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
          <dt>Source type</dt>
          <dd>{item.sourceType.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Shared</dt>
          <dd>{item.shareIncluded ? "Included in report" : "Hidden by default"}</dd>
        </div>
        <div>
          <dt>Metadata</dt>
          <dd>{Object.keys(item.metadata).length} detail(s)</dd>
        </div>
      </dl>
    </article>
  );
}
