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
          <strong className="hero-score">
            {report.overallScore !== null ? report.overallScore : "--"}
          </strong>
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
