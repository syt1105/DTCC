import type { DecisionFactorName, OlaTarget, Vulnerability } from "@/lib/types";

/**
 * Translation layer between our internal PoC values and Protocol
 * Specification v3.1 naming/structure. Display components should read
 * labels from here rather than hardcoding spec terminology inline, so a
 * future rewrite of the calculation logic (lib/vulnerabilities.ts) to
 * match the real cascade only requires updating the calculation files —
 * not every component that renders a label.
 *
 * These are DISPLAY-ONLY mappings. lib/vulnerabilities.ts still runs its
 * existing composite-score logic, not the spec's cascade/RTO/OLA tables.
 */

export type SpecCascadeStageName =
  | "CVSS Filter"
  | "KEV Check"
  | "EPSS Threshold"
  | "Threat Intel Modifier"
  | "Asset Criticality"
  | "Exposure Modifier";

type DecisionPathStageMeta = {
  specLabel: SpecCascadeStageName;
  /** Stage number per Protocol Spec v3.1 section 2.2. */
  specStageNumber: number;
  /** Display order matching the spec's cascade order (1-6). */
  sortOrder: number;
};

// Maps our current 6 internal decision-path stages (see buildDecisionPath in
// lib/vulnerabilities.ts) to the closest corresponding stage in the spec's
// six-stage cascade (Protocol Spec v3.1, section 2.2). This is a best-fit
// mapping, not a 1:1 semantic match — see conversation/PR notes.
export const DECISION_PATH_STAGE_LABELS: Record<DecisionFactorName, DecisionPathStageMeta> = {
  "DTCC Severity": { specLabel: "CVSS Filter", specStageNumber: 1, sortOrder: 1 },
  "Remediation Decision": { specLabel: "KEV Check", specStageNumber: 2, sortOrder: 2 },
  "OLA Target": { specLabel: "EPSS Threshold", specStageNumber: 3, sortOrder: 3 },
  "Threat Activity": { specLabel: "Threat Intel Modifier", specStageNumber: 4, sortOrder: 4 },
  "Business Risk": { specLabel: "Asset Criticality", specStageNumber: 5, sortOrder: 5 },
  Exposure: { specLabel: "Exposure Modifier", specStageNumber: 6, sortOrder: 6 }
};

// Maps our current 3-value asset tier to a display-only RTO tier band per
// Protocol Spec v3.1 section 3.5. The underlying `tier` field and its
// scoring weight in lib/vulnerabilities.ts are unchanged. The spec defines
// 6 RTO tiers (0-5); we don't track that granularity yet, so each of our
// 3 tiers is shown as its closest 2-tier RTO band.
export const RTO_TIER_LABELS: Record<Vulnerability["tier"], string> = {
  "Tier 1": "RTO Tier 0-1 (Mission-Critical)",
  "Tier 2": "RTO Tier 2-3 (Moderate)",
  "Tier 3": "RTO Tier 4-5 (Low Criticality)"
};

// Maps our current 4 OLA buckets to the closest matching named sub-tier
// from Protocol Spec v3.1 section 7.2, by matching OLA duration. The
// underlying deriveOlaTarget calculation and bucket values are unchanged;
// the spec defines 8 named sub-tiers, which our 4 buckets approximate.
export const OLA_SUBTIER_LABELS: Record<OlaTarget, string> = {
  "24 hours": "ACT-Emergency",
  "7 days": "ACT-HighExposure",
  "30 days": "ATTEND-Standard",
  "Next cycle": "TRACK-Standard"
};
