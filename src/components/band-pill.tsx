import type {
  ConfidenceBand,
  PublicationStatus,
  ProfileStatus,
  RecommendationStatus,
  TrustBand,
} from "@/lib/types";

type PillTone =
  | TrustBand
  | ConfidenceBand
  | RecommendationStatus
  | ProfileStatus
  | PublicationStatus
  | "Verified"
  | "Self reported"
  | "Missing";

function toneClass(tone: PillTone) {
  switch (tone) {
    case "Strong":
    case "High":
    case "Verified":
    case "published":
      return "pill pill--positive";
    case "Moderate":
    case "Medium":
    case "Self reported":
    case "Recommended":
      return "pill pill--balanced";
    case "Weak":
    case "Low":
    case "Potential inconsistency detected":
    case "Missing":
    case "error":
      return "pill pill--caution";
    case "Insufficient evidence":
    case "Needs manual review":
    case "draft":
    case "submitted":
    case "grading":
    case "needs_review":
    case "complete":
    case "private":
      return "pill pill--neutral";
    case "Unknown":
    default:
      return "pill pill--neutral";
  }
}

export function BandPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={toneClass(tone)}>{children}</span>;
}
