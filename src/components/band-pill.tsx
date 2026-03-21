import type { ConfidenceBand, RecommendationState, TrustBand } from "@/lib/types";

type PillTone =
  | TrustBand
  | ConfidenceBand
  | RecommendationState
  | "Proceed to manual approval review"
  | "Continue manual review"
  | "Needs more information"
  | "Verified"
  | "User provided"
  | "Missing";

function toneClass(tone: PillTone) {
  switch (tone) {
    case "Strong":
    case "High":
    case "Verified":
      return "pill pill--positive";
    case "Moderate":
    case "Medium":
    case "User provided":
    case "Recommended for manual approval path":
    case "Proceed to manual approval review":
      return "pill pill--balanced";
    case "Weak":
    case "Low":
    case "Potential inconsistency detected":
    case "Missing":
      return "pill pill--caution";
    case "Insufficient data":
    case "Needs manual review":
    case "Continue manual review":
    case "Needs more information":
      return "pill pill--neutral";
    case "Unknown":
    default:
      return "pill pill--neutral";
  }
}

export function BandPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={toneClass(tone)}>{children}</span>;
}
