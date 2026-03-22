import { BandPill } from "@/components/band-pill";
import { formatDate } from "@/lib/format";
import type { ApplicantProfileView } from "@/lib/types";

export function RecommendationBanner({ view }: { view: ApplicantProfileView }) {
  const result = view.gradingResult?.finalResult;

  return (
    <section className="hero-card stack-md">
      <div className="row row--space-start row--top">
        <div className="stack-sm">
          <span className="eyebrow">Applicant Profile</span>
          <h1>{view.applicant.fullName}</h1>
          <p className="lede">
            Housing-specific application result generated for rental review,
            with explainable evidence, confidence-aware evaluation, and a separate publish step for public use.
          </p>
        </div>
        <div className="score-panel">
          <span className="score-kicker">Application result</span>
          <strong className="hero-score">
            {result?.overallScore ?? "--"}
          </strong>
          <BandPill tone={result?.confidence ?? "Low"}>
            {result?.confidence ?? "Low"} confidence
          </BandPill>
        </div>
      </div>
      <div className="chip-group">
        <BandPill tone={result?.recommendationStatus ?? "Needs manual review"}>
          {result?.recommendationStatus ?? "Needs manual review"}
        </BandPill>
        <BandPill tone={view.profile.status}>{view.profile.status.replaceAll("_", " ")}</BandPill>
        <BandPill tone={view.profile.publicationStatus}>
          {view.profile.publicationStatus === "published" ? "published" : "private"}
        </BandPill>
        <span className="chip chip--outline">Updated {formatDate(view.profile.updatedAt)}</span>
        <span className="chip chip--outline">
          Target rent ${view.submission.rawFormSnapshot.personalInformation.targetRent}/mo
        </span>
      </div>
      <p className="body-strong">
        {result?.summary ??
          "Credora is still processing this housing application profile."}
      </p>
    </section>
  );
}
