import { BandPill } from "@/components/band-pill";
import type { TrustCategory } from "@/lib/types";

export function CategoryCard({ category }: { category: TrustCategory }) {
  return (
    <article className="card stack-sm">
      <div className="row row--space-start">
        <div className="stack-xs">
          <span className="eyebrow eyebrow--subtle">{category.weight}% weight</span>
          <h3>{category.title}</h3>
        </div>
        <div className="stack-xs align-end">
          <BandPill tone={category.band}>{category.band}</BandPill>
          <strong className="score-number">
            {typeof category.score === "number" ? category.score : "--"}
          </strong>
        </div>
      </div>
      <p className="body-muted">{category.rationale}</p>
      <div className="chip-group">
        {category.drivers.map((driver) => (
          <span key={driver} className="chip chip--soft">
            {driver}
          </span>
        ))}
      </div>
      {category.flags.length > 0 ? (
        <div className="stack-xs">
          <span className="mini-label">Review flags</span>
          <ul className="list">
            {category.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
