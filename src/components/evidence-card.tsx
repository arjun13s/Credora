import { Check, X } from "lucide-react";
import type { EvidenceItem } from "@/lib/types";

export function EvidenceCard({ item }: { item: EvidenceItem }) {
  const isVerified = item.verificationState === "verified";

  return (
    <article className="card stack-sm">
      <div className="row row--space-start">
        <div className="stack-xs">
          <span className="eyebrow eyebrow--subtle">{item.category.replaceAll("_", " ")}</span>
          <h3>{item.label}</h3>
        </div>
        {isVerified ? (
          <Check size={18} style={{ color: "var(--positive)", flexShrink: 0 }} />
        ) : (
          <X size={18} style={{ color: "var(--caution)", flexShrink: 0 }} />
        )}
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
