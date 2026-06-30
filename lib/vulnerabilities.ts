import vulnerabilitiesData from "@/data/vulnerabilities.json";
import type { DecisionPathStep, Recommendation, Vulnerability } from "@/lib/types";

export const vulnerabilities = vulnerabilitiesData as Vulnerability[];

const severityRank: Record<Recommendation, number> = {
  TRACK: 1,
  ATTEND: 2,
  ACT: 3
};

export function getVulnerability(id: string) {
  return vulnerabilities.find((vulnerability) => vulnerability.id === id);
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
      summary[vulnerability.recommendation] += 1;
      return summary;
    },
    { ACT: 0, ATTEND: 0, TRACK: 0 } as Record<Recommendation, number>
  );
}

export function deriveRecommendation(vulnerability: Vulnerability): Recommendation {
  const factors = deriveSsvcFactorValues(vulnerability);

  if (
    factors.exploitation === "Active" &&
    ((factors.technicalImpact === "Total" &&
      (factors.businessImpact === "High" || factors.missionPrevalence === "High")) ||
      (factors.businessImpact === "High" && factors.automatable !== "No"))
  ) {
    return "ACT";
  }

  if (
    factors.exploitation === "Active" &&
    factors.technicalImpact === "Total" &&
    vulnerability.tier !== "Tier 3"
  ) {
    return "ACT";
  }

  if (
    factors.exploitation === "Active" &&
    (factors.technicalImpact === "Total" ||
      factors.automatable !== "No" ||
      factors.missionPrevalence !== "Low" ||
      factors.businessImpact !== "Low")
  ) {
    return "ATTEND";
  }

  if (
    factors.exploitation === "PoC / likely" &&
    (factors.technicalImpact !== "Limited" ||
      factors.automatable !== "No" ||
      factors.missionPrevalence !== "Low" ||
      factors.businessImpact !== "Low")
  ) {
    return "ATTEND";
  }

  return "TRACK";
}

export function buildReasoning(vulnerability: Vulnerability) {
  const recommendation = deriveRecommendation(vulnerability);
  const evidence = ["CVE.org / NVD", "CISA KEV", "FIRST EPSS", "Mock Asset Inventory", "Simulated Threat Intelligence"];
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

function deriveSsvcFactorValues(vulnerability: Vulnerability) {
  const exploitation = vulnerability.kev
    ? "Active"
    : vulnerability.epss >= 0.7
      ? "PoC / likely"
      : "Monitored";

  const automatable =
    vulnerability.internetFacing && (vulnerability.cvss >= 8.5 || vulnerability.epss >= 0.7)
      ? "Yes"
      : vulnerability.internetFacing || vulnerability.epss >= 0.7
        ? "Limited"
        : "No";

  const technicalImpact =
    vulnerability.cvss >= 9 ? "Total" : vulnerability.cvss >= 7 ? "Partial" : "Limited";

  const missionPrevalence =
    vulnerability.tier === "Tier 1" || vulnerability.businessCritical
      ? "High"
      : vulnerability.tier === "Tier 2"
        ? "Medium"
        : "Low";

  const businessImpact =
    vulnerability.missionDependency === "High"
      ? "High"
      : vulnerability.businessCritical || vulnerability.missionDependency === "Medium"
        ? "Medium"
        : "Low";

  return {
    exploitation,
    automatable,
    technicalImpact,
    missionPrevalence,
    businessImpact
  };
}

function buildDecisionPath(vulnerability: Vulnerability, recommendation: Recommendation): DecisionPathStep[] {
  const factors = deriveSsvcFactorValues(vulnerability);

  return [
    {
      label: "Exploitation",
      value: factors.exploitation,
      source: vulnerability.kev
        ? `CISA KEV${vulnerability.kevDateAdded ? `, added ${vulnerability.kevDateAdded}` : ""}`
        : `FIRST EPSS ${vulnerability.epss.toFixed(5)} as of ${vulnerability.epssDate}`,
      rationale: vulnerability.kev
        ? "Observed exploitation is confirmed by CISA KEV."
        : vulnerability.epss >= 0.7
          ? "The CVE is not in KEV, but EPSS indicates elevated exploitation likelihood."
          : "No KEV listing and EPSS does not indicate elevated near-term likelihood.",
      tone: vulnerability.kev ? "ACT" : vulnerability.epss >= 0.7 ? "ATTEND" : "TRACK"
    },
    {
      label: "Automatable",
      value: factors.automatable,
      source: `${vulnerability.internetFacing ? "Internet-facing" : "Internal"} asset, CVSS ${vulnerability.cvss.toFixed(1)}`,
      rationale:
        factors.automatable === "Yes"
          ? "External exposure and high exploitability make repeatable exploitation plausible."
          : factors.automatable === "Limited"
            ? "Some exploitability indicators exist, but exposure or severity reduces confidence."
            : "Internal-only exposure and lower exploitability reduce automation concerns.",
      tone: factors.automatable === "Yes" ? "ACT" : factors.automatable === "Limited" ? "ATTEND" : "TRACK"
    },
    {
      label: "Technical Impact",
      value: factors.technicalImpact,
      source: vulnerability.cvssSource,
      rationale:
        factors.technicalImpact === "Total"
          ? `CVSS ${vulnerability.cvss.toFixed(1)} indicates critical technical impact.`
          : factors.technicalImpact === "Partial"
            ? `CVSS ${vulnerability.cvss.toFixed(1)} indicates meaningful but not total impact.`
            : `CVSS ${vulnerability.cvss.toFixed(1)} indicates limited technical impact.`,
      tone: factors.technicalImpact === "Total" ? "ACT" : factors.technicalImpact === "Partial" ? "ATTEND" : "TRACK"
    },
    {
      label: "Mission Prevalence",
      value: factors.missionPrevalence,
      source: `${vulnerability.tier}${vulnerability.businessCritical ? ", business critical" : ""}`,
      rationale:
        factors.missionPrevalence === "High"
          ? "The affected asset is central enough to influence remediation urgency."
          : factors.missionPrevalence === "Medium"
            ? "The affected asset is important, but not the highest tier in this PoC context."
            : "The affected asset has limited mission prevalence in this PoC context.",
      tone: factors.missionPrevalence === "High" ? "ACT" : factors.missionPrevalence === "Medium" ? "ATTEND" : "TRACK"
    },
    {
      label: "Business Impact",
      value: factors.businessImpact,
      source: `${vulnerability.businessUnit}, mission dependency ${vulnerability.missionDependency}`,
      rationale:
        factors.businessImpact === "High"
          ? "Service disruption or compromise would materially affect mission delivery."
          : factors.businessImpact === "Medium"
            ? "Business impact is meaningful but does not trigger the highest response tier alone."
            : "Business impact is limited in the simulated enterprise context.",
      tone: factors.businessImpact === "High" ? "ACT" : factors.businessImpact === "Medium" ? "ATTEND" : "TRACK"
    },
    {
      label: "SSVC Decision",
      value: recommendation,
      source: "SSVC-inspired PoC decision policy",
      rationale:
        recommendation === "ACT"
          ? "Active or highly likely exploitation intersects with material mission or business impact."
          : recommendation === "ATTEND"
            ? "The issue warrants scheduled analyst attention, but not immediate emergency action."
            : "The issue should remain visible, but current factors support monitoring over action.",
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
  return severityRank[b.recommendation] - severityRank[a.recommendation] || b.cvss - a.cvss;
}
