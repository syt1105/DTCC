import vulnerabilitiesData from "@/data/vulnerabilities.json";
import type {
  DecisionPathStep,
  OlaTarget,
  Recommendation,
  SeverityBand,
  ThreatActorActivity,
  Vulnerability
} from "@/lib/types";

export const vulnerabilities = vulnerabilitiesData as Vulnerability[];

export const batchLookupCatalog: Vulnerability[] = [
  {
    id: "CVE-2024-28995",
    product: "SolarWinds Serv-U",
    cveTitle: "SolarWinds Serv-U Directory Traversal Vulnerability",
    description: "Directory traversal vulnerability in SolarWinds Serv-U that may allow access to sensitive files.",
    cvss: 8.6,
    cvssSource: "CVE.org CNA record, CVSS v3.1",
    epss: 0.82,
    epssPercentile: 0.96,
    epssDate: "2026-06-29",
    kev: true,
    kevDateAdded: "2024-07-17",
    kevSource: "CISA Known Exploited Vulnerabilities Catalog",
    tier: "Tier 2",
    businessUnit: "Managed File Transfer",
    internetFacing: true,
    businessCritical: true,
    missionDependency: "High",
    threatActorActivity: "ACTIVE_EXPLOITATION",
    recommendation: "ACT",
    confidence: 91,
    vulnerableVersions: ["Serv-U 15.4.2 HF1 and earlier"],
    availableFixes: ["Upgrade to Serv-U 15.4.2 HF2 or later", "Restrict management interface exposure"],
    remediationStatus: "Scheduled"
  },
  {
    id: "CVE-2024-40766",
    product: "SonicWall SonicOS",
    cveTitle: "SonicWall SonicOS Improper Access Control Vulnerability",
    description: "Improper access control vulnerability affecting SonicWall firewall management and SSLVPN surfaces.",
    cvss: 9.3,
    cvssSource: "CVE.org CNA record, CVSS v3.1",
    epss: 0.74,
    epssPercentile: 0.94,
    epssDate: "2026-06-29",
    kev: true,
    kevDateAdded: "2024-09-09",
    kevSource: "CISA Known Exploited Vulnerabilities Catalog",
    tier: "Tier 1",
    businessUnit: "Network Security",
    internetFacing: true,
    businessCritical: true,
    missionDependency: "High",
    threatActorActivity: "FINANCIAL_SECTOR_TARGETING",
    recommendation: "ACT",
    confidence: 94,
    vulnerableVersions: ["SonicOS 7.0.1-5035 and earlier", "SonicOS 7.1.1-7051 and earlier"],
    availableFixes: ["Upgrade to SonicOS vendor fixed release", "Disable WAN management until patched"],
    remediationStatus: "Open"
  },
  {
    id: "CVE-2025-0108",
    product: "Palo Alto Networks PAN-OS",
    cveTitle: "PAN-OS Management Interface Authentication Bypass Vulnerability",
    description: "Authentication bypass vulnerability affecting exposed PAN-OS management interfaces.",
    cvss: 8.8,
    cvssSource: "CVE.org CNA record, CVSS v3.1",
    epss: 0.68,
    epssPercentile: 0.92,
    epssDate: "2026-06-29",
    kev: false,
    kevDateAdded: null,
    kevSource: "CISA Known Exploited Vulnerabilities Catalog",
    tier: "Tier 1",
    businessUnit: "Network Security",
    internetFacing: true,
    businessCritical: true,
    missionDependency: "High",
    threatActorActivity: "ACTIVE_EXPLOITATION",
    recommendation: "ATTEND",
    confidence: 86,
    vulnerableVersions: ["PAN-OS 10.2 prior to fixed maintenance release", "PAN-OS 11.1 prior to fixed maintenance release"],
    availableFixes: ["Apply vendor hotfix", "Restrict management interface to trusted admin network"],
    remediationStatus: "Open"
  }
];

export const allVulnerabilityCatalog = [...vulnerabilities, ...batchLookupCatalog];

const severityRank: Record<Recommendation, number> = {
  TRACK: 1,
  ATTEND: 2,
  ACT: 3
};

export function getVulnerability(id: string) {
  return allVulnerabilityCatalog.find((vulnerability) => vulnerability.id === id);
}

export function lookupVulnerabilities(ids: string[]) {
  return ids.map((id) => ({
    id,
    vulnerability: allVulnerabilityCatalog.find((vulnerability) => vulnerability.id === id) ?? null
  }));
}

export function recommendationTone(recommendation: Recommendation) {
  if (recommendation === "ACT") return "text-act bg-red-50 border-red-100";
  if (recommendation === "ATTEND") return "text-attend bg-orange-50 border-orange-100";
  return "text-track bg-green-50 border-green-100";
}

export function leftBorderTone(recommendation: Recommendation) {
  if (recommendation === "ACT") return "border-l-act";
  if (recommendation === "ATTEND") return "border-l-attend";
  return "border-l-track";
}

export function getSummaryCounts() {
  return vulnerabilities.reduce(
    (summary, vulnerability) => {
      summary[deriveRecommendation(vulnerability)] += 1;
      return summary;
    },
    { ACT: 0, ATTEND: 0, TRACK: 0 } as Record<Recommendation, number>
  );
}

export function deriveRecommendation(vulnerability: Vulnerability): Recommendation {
  if (deriveAcceleratedRemediation(vulnerability)) {
    return "ACT";
  }

  const score = deriveDtccSeverityScore(vulnerability);
  if (score >= 55) {
    return "ATTEND";
  }

  return "TRACK";
}

export function buildReasoning(vulnerability: Vulnerability) {
  const recommendation = deriveRecommendation(vulnerability);
  const evidence = ["CVE.org / NVD", "CISA KEV", "FIRST EPSS", "Mock Asset Inventory", "Threat Activity Model"];
  const decisionPath = buildDecisionPath(vulnerability, recommendation);
  const log = decisionPath.map((step) => `${step.label}: ${step.value}. ${step.rationale}`);

  return {
    evidence,
    log,
    decisionPath,
    confidence: vulnerability.confidence,
    recommendation
  };
}

export function threatActorActivityLabel(activity: ThreatActorActivity) {
  if (activity === "FINANCIAL_SECTOR_TARGETING") return "Financial sector targeting";
  if (activity === "ACTIVE_EXPLOITATION") return "Active exploitation";
  return "No known activity";
}

export function threatActorActivityTone(activity: ThreatActorActivity): Recommendation | "neutral" {
  if (activity === "FINANCIAL_SECTOR_TARGETING") return "ACT";
  if (activity === "ACTIVE_EXPLOITATION") return "ATTEND";
  return "TRACK";
}

export function deriveDtccSeverityScore(vulnerability: Vulnerability) {
  let score = 0;

  score += vulnerability.cvss >= 9 ? 12 : vulnerability.cvss >= 7 ? 8 : 4;
  score += Math.round(vulnerability.epss * 18);
  score += vulnerability.kev ? 12 : 0;
  score += vulnerability.internetFacing ? 12 : 0;
  score += vulnerability.tier === "Tier 1" ? 12 : vulnerability.tier === "Tier 2" ? 7 : 3;
  score += vulnerability.businessCritical ? 8 : 0;
  score += vulnerability.missionDependency === "High" ? 8 : vulnerability.missionDependency === "Medium" ? 4 : 0;
  score += vulnerability.threatActorActivity === "FINANCIAL_SECTOR_TARGETING" ? 18 : 0;
  score += vulnerability.threatActorActivity === "ACTIVE_EXPLOITATION" ? 10 : 0;

  return Math.min(100, score);
}

export function deriveSeverityBand(score: number): SeverityBand {
  if (score >= 90) return "Critical";
  if (score >= 75) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

export function deriveOlaTarget(score: number): OlaTarget {
  if (score >= 90) return "24 hours";
  if (score >= 75) return "7 days";
  if (score >= 55) return "30 days";
  return "Next cycle";
}

export function deriveAcceleratedRemediation(vulnerability: Vulnerability) {
  const score = deriveDtccSeverityScore(vulnerability);
  return (
    score >= 90 ||
    vulnerability.threatActorActivity === "FINANCIAL_SECTOR_TARGETING" ||
    (vulnerability.kev &&
      vulnerability.internetFacing &&
      (vulnerability.tier === "Tier 1" || vulnerability.businessCritical))
  );
}

export function getGovernanceDecision(vulnerability: Vulnerability) {
  const score = deriveDtccSeverityScore(vulnerability);
  const severityBand = deriveSeverityBand(score);
  const olaTarget = deriveOlaTarget(score);
  const acceleratedRemediation = deriveAcceleratedRemediation(vulnerability);
  const recommendation = deriveRecommendation(vulnerability);

  return {
    score,
    severityBand,
    olaTarget,
    acceleratedRemediation,
    recommendation
  };
}

function buildDecisionPath(vulnerability: Vulnerability, recommendation: Recommendation): DecisionPathStep[] {
  const governance = getGovernanceDecision(vulnerability);
  const threatTone = threatActorActivityTone(vulnerability.threatActorActivity);
  const exposureValue = vulnerability.internetFacing ? "Internet-facing" : "Internal";
  const businessRisk =
    vulnerability.businessCritical || vulnerability.missionDependency === "High"
      ? "High"
      : vulnerability.missionDependency === "Medium"
        ? "Medium"
        : "Low";

  return [
    {
      label: "Threat Activity",
      value: threatActorActivityLabel(vulnerability.threatActorActivity),
      source: vulnerability.kev
        ? `CISA KEV${vulnerability.kevDateAdded ? `, added ${vulnerability.kevDateAdded}` : ""}`
        : "Simulated threat activity assessment",
      rationale:
        vulnerability.threatActorActivity === "FINANCIAL_SECTOR_TARGETING"
          ? "Threat actors are modeled as targeting the financial sector, increasing urgency beyond generic exploitation."
          : vulnerability.threatActorActivity === "ACTIVE_EXPLOITATION"
            ? "Threat actors are modeled as actively leveraging exploitation, but not specifically against financial institutions."
            : "No known threat actor activity is modeled for this PoC record.",
      tone: threatTone
    },
    {
      label: "Exposure",
      value: exposureValue,
      source: `${vulnerability.tier}, ${vulnerability.internetFacing ? "external exposure" : "internal exposure"}`,
      rationale:
        vulnerability.internetFacing
          ? "Internet-facing exposure increases the probability that exploitation can reach enterprise assets."
          : "Internal-only exposure lowers urgency unless business or threat context raises the score.",
      tone: vulnerability.internetFacing ? "ATTEND" : "TRACK"
    },
    {
      label: "Business Risk",
      value: businessRisk,
      source: `${vulnerability.businessUnit}, mission dependency ${vulnerability.missionDependency}`,
      rationale:
        businessRisk === "High"
          ? "Business context indicates material mission or operational impact."
          : businessRisk === "Medium"
            ? "Business impact is meaningful, but not the highest internal risk tier."
            : "Business impact is limited in the simulated enterprise context.",
      tone: businessRisk === "High" ? "ACT" : businessRisk === "Medium" ? "ATTEND" : "TRACK"
    },
    {
      label: "DTCC Severity",
      value: `${governance.score} / 100`,
      source: "Simulated internal severity score",
      rationale:
        "The score combines exposure, business risk, CISA KEV, EPSS, CVSS, and threat activity instead of relying on CVSS alone.",
      tone:
        governance.severityBand === "Critical"
          ? "ACT"
          : governance.severityBand === "High" || governance.severityBand === "Medium"
            ? "ATTEND"
            : "TRACK"
    },
    {
      label: "OLA Target",
      value: governance.olaTarget,
      source: `${governance.severityBand} internal severity`,
      rationale:
        "Operations Level Agreement is driven by DTCC-style internal severity, not by CVSS severity alone.",
      tone:
        governance.olaTarget === "24 hours"
          ? "ACT"
          : governance.olaTarget === "7 days" || governance.olaTarget === "30 days"
            ? "ATTEND"
            : "TRACK"
    },
    {
      label: "Remediation Decision",
      value: recommendation,
      source: governance.acceleratedRemediation ? "Accelerated remediation required" : "Standard OLA workflow",
      rationale:
        governance.acceleratedRemediation
          ? "Emergency criteria focus on accelerated remediation for high internal severity or targeted financial-sector threat activity."
          : recommendation === "ATTEND"
            ? "The issue should be scheduled under the OLA target without emergency remediation."
            : "The issue remains visible for tracking under the next standard review cycle.",
      tone: recommendation
    }
  ];
}

export function getDefaultOverrideDecision(recommendation: Recommendation): Recommendation {
  if (recommendation === "ACT") return "ATTEND";
  if (recommendation === "ATTEND") return "TRACK";
  return "ATTEND";
}

export function sortByRecommendationPriority(a: Vulnerability, b: Vulnerability) {
  return (
    severityRank[deriveRecommendation(b)] - severityRank[deriveRecommendation(a)] ||
    deriveDtccSeverityScore(b) - deriveDtccSeverityScore(a) ||
    b.cvss - a.cvss
  );
}
