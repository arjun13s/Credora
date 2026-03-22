import { BandPill } from "@/components/band-pill";
import { formatDate } from "@/lib/format";
import type { ProfileSummary } from "@/lib/types";

export function RecommendationBanner({ report }: { report: ProfileSummary }) {
  const rawScore = report.overallScore;
  const score = rawScore !== null ? Math.round(rawScore) : null;
  const ringPct = score !== null ? score : 0;

  return (
    <section
      className="hero-card"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "2rem",
        alignItems: "start",
      }}
    >
      {/* Left: name + narrative */}
      <div className="stack-md">
        <div className="stack-xs">
          <span className="eyebrow">Rental reliability profile</span>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", maxWidth: "none" }}>
            {report.applicantName}
          </h1>
        </div>

        <div className="chip-group">
          <BandPill tone={report.recommendation}>{report.recommendation}</BandPill>
          <span className="chip chip--outline">
            Valid through {formatDate(report.validUntil)}
          </span>
          <span className="chip chip--outline">
            Target rent ${report.targetRent}/mo
          </span>
        </div>

        <p className="body-strong">{report.narrative}</p>
      </div>

      {/* Right: score ring */}
      <div className="score-panel">
        <span className="eyebrow">Score</span>
        <div
          className="score-ring-wrapper"
          style={
            { "--target-score": `${ringPct}%` } as React.CSSProperties
          }
        >
          <div className="score-ring-inner">
            <strong className="hero-score">
              {score !== null ? score : "--"}
            </strong>
            {score !== null && <span className="score-max">/ 100</span>}
          </div>
        </div>
        <BandPill tone={report.confidence}>{report.confidence} confidence</BandPill>
      </div>
    </section>
  );
}
