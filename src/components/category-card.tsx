import type { CategoryAssessment } from "@/lib/types";

export function CategoryCard({ category }: { category: CategoryAssessment }) {
  return (
    <article className="card stack-sm">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div className="stack-xs" style={{ flex: 1 }}>
          <span className="eyebrow eyebrow--subtle">{category.key.replaceAll("_", " ")}</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem" }}>
            <h3 style={{ margin: 0 }}>{category.title}</h3>
            <strong className="score-number" style={{ flexShrink: 0 }}>
              {typeof category.score === "number" ? Math.round(category.score) : "--"}
            </strong>
          </div>
        </div>
      </div>
      <div className="score-bar-track">
        <div
          className={`score-bar-fill score-bar--${category.band.toLowerCase()}`}
          style={{ width: `${Math.round(typeof category.score === "number" ? category.score : 0)}%` }}
        />
      </div>
      <p className="body-muted">{category.rationale}</p>
    </article>
  );
}
