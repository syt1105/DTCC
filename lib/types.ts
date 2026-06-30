export type Recommendation = "ACT" | "ATTEND" | "TRACK";

export type MissionDependency = "High" | "Medium" | "Low";

export type Vulnerability = {
  id: string;
  product: string;
  description: string;
  cvss: number;
  epss: number;
  kev: boolean;
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  businessUnit: string;
  internetFacing: boolean;
  businessCritical: boolean;
  missionDependency: MissionDependency;
  recommendation: Recommendation;
  confidence: number;
};

export type DecisionPathStep = {
  label: string;
  value: string;
  tone: Recommendation | "neutral";
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
  status: "Approved" | "Overridden";
  comments?: string;
};
