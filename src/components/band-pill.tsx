import type {
  ConfidenceBand,
  ProfileStatus,
  RecommendationStatus,
  ShareStatus,
  TrustBand,
} from "@/lib/types";

type PillTone =
  | TrustBand
  | ConfidenceBand
  | RecommendationStatus
  | ProfileStatus
  | ShareStatus
  | "Manual review advised"
  | "Need more documents"
  | "Proceed carefully"
  | "Verified"
  | "Self reported"
  | "Missing";

function toneClass(tone: PillTone) {
  switch (tone) {
    case "Strong":
    case "High":
    case "Verified":
      return "pill pill--positive";
    case "Moderate":
    case "Medium":
    case "Self reported":
    case "Recommended":
    case "Proceed carefully":
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
    case "Need more documents":
    case "Manual review advised":
    case "shareable":
    case "private":
    case "revoked":
      return "pill pill--neutral";
    case "Unknown":
    default:
      return "pill pill--neutral";
  }
}

export function BandPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={toneClass(tone)}>{children}</span>;
}
