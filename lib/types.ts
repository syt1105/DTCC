export type Recommendation = "ACT" | "ATTEND" | "TRACK";

export type MissionDependency = "High" | "Medium" | "Low";

export type ThreatActorActivity =
  | "NO_KNOWN_ACTIVITY"
  | "ACTIVE_EXPLOITATION"
  | "FINANCIAL_SECTOR_TARGETING";

export type SeverityBand = "Critical" | "High" | "Medium" | "Low";

export type OlaTarget = "24 hours" | "7 days" | "30 days" | "Next cycle";

export type DecisionFactorName =
  | "Threat Activity"
  | "Exposure"
  | "Business Risk"
  | "DTCC Severity"
  | "OLA Target"
  | "Remediation Decision";

export type Vulnerability = {
  id: string;
  product: string;
  cveTitle: string;
  description: string;
  cvss: number;
  cvssSource: string;
  epss: number;
  epssPercentile: number;
  epssDate: string;
  kev: boolean;
  kevDateAdded: string | null;
  kevSource: string;
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  businessUnit: string;
  internetFacing: boolean;
  businessCritical: boolean;
  missionDependency: MissionDependency;
  threatActorActivity: ThreatActorActivity;
  recommendation: Recommendation;
  confidence: number;
  vulnerableVersions?: string[];
  availableFixes?: string[];
  remediationStatus?: "Open" | "Scheduled" | "In Progress" | "Remediated" | "Dismissed";
};

export type DecisionPathStep = {
  label: DecisionFactorName;
  value: string;
  source: string;
  rationale: string;
  tone: Recommendation | "neutral";
  specLabel: string;
  specSortOrder: number;
};

export type ReasoningOutput = {
  evidence: string[];
  log: string[];
  decisionPath: DecisionPathStep[];
  confidence: number;
  recommendation: Recommendation;
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  analyst: string;
  cve: string;
  recommendation: Recommendation;
  finalDecision: Recommendation;
  override: boolean;
  reason: string;
  status: "Approved" | "Overridden" | "Dismissed";
  comments?: string;
  decisionType?: "AI Recommendation Retained" | "Human Override" | "Dismissed as Not Applicable";
  dtccSeverityScore?: number;
  dtccSeverityBand?: SeverityBand;
  olaTarget?: OlaTarget;
  acceleratedRemediation?: boolean;
};
