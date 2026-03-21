import { BandPill } from "@/components/band-pill";
import { formatDate } from "@/lib/format";
import type { ProfileSummary } from "@/lib/types";

export function RecommendationBanner({ report }: { report: ProfileSummary }) {
  return (
    <section className="hero-card stack-md">
      <div className="row row--space-start row--top">
        <div className="stack-sm">
          <span className="eyebrow">Rental reliability profile</span>
          <h1>{report.applicantName}</h1>
          <p className="lede">
            {report.personaLabel}. Generated for housing screening only, with
            applicant-visible evidence and a dispute path.
          </p>
        </div>
        <div className="score-panel">
          <span className="score-kicker">Explainable score</span>
          <div className="score-ring-wrap">
            <svg className="score-ring" viewBox="0 0 100 100" width="110" height="110">
              <circle className="score-ring-track" cx="50" cy="50" r="42" />
              <circle
                className="score-ring-fill"
                cx="50"
                cy="50"
                r="42"
                strokeDasharray="263.9"
                strokeDashoffset={
                  report.overallScore !== null
                    ? 263.9 * (1 - report.overallScore / 100)
                    : 263.9
                }
              />
            </svg>
            <strong className="hero-score">
              {report.overallScore !== null ? report.overallScore : "--"}
            </strong>
          </div>
          <BandPill tone={report.confidence}>{report.confidence} confidence</BandPill>
        </div>
      </div>
      <div className="chip-group">
        <BandPill tone={report.recommendation}>{report.recommendation}</BandPill>
        <span className="chip chip--outline">Valid through {formatDate(report.validUntil)}</span>
        <span className="chip chip--outline">Target rent ${report.targetRent}/mo</span>
      </div>
      <p className="body-strong">{report.narrative}</p>
    </section>
  );
}
