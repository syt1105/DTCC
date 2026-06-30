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
  if (vulnerability.kev && vulnerability.internetFacing && vulnerability.tier === "Tier 1") {
    return "ACT";
  }

  if (
    vulnerability.kev &&
    vulnerability.businessCritical &&
    (vulnerability.epss >= 0.75 || vulnerability.tier !== "Tier 3")
  ) {
    return "ACT";
  }

  if (
    vulnerability.cvss >= 9 ||
    vulnerability.epss >= 0.5 ||
    vulnerability.businessCritical ||
    vulnerability.internetFacing
  ) {
    return "ATTEND";
  }

  return "TRACK";
}

export function buildReasoning(vulnerability: Vulnerability) {
  const recommendation = deriveRecommendation(vulnerability);
  const evidence = ["NVD", "KEV", "EPSS", "Asset Inventory", "Threat Intelligence"];
  const log: string[] = [];

  if (vulnerability.kev) {
    log.push("KEV listed, confirming exploitation has been observed in the wild.");
  } else {
    log.push("Not currently KEV listed, so the immediate exploitation gate is not triggered.");
  }

  if (vulnerability.epss >= 0.9) {
    log.push(`EPSS ${vulnerability.epss.toFixed(2)} indicates very high probability of exploitation.`);
  } else if (vulnerability.epss >= 0.5) {
    log.push(`EPSS ${vulnerability.epss.toFixed(2)} exceeds the ATTEND threshold.`);
  } else {
    log.push(`EPSS ${vulnerability.epss.toFixed(2)} remains below the high-likelihood threshold.`);
  }

  if (vulnerability.internetFacing) {
    log.push(`${vulnerability.tier} asset is internet-facing, increasing exposure and response urgency.`);
  } else {
    log.push(`${vulnerability.tier} asset is internal, reducing immediate external exposure.`);
  }

  if (vulnerability.businessCritical) {
    log.push(`${vulnerability.businessUnit} is business critical with ${vulnerability.missionDependency.toLowerCase()} mission dependency.`);
  } else {
    log.push(`${vulnerability.businessUnit} has limited mission dependency for this review.`);
  }

  log.push(`SSVC outcome: ${recommendation}, aligned to the observed threat and business context.`);

  return {
    evidence,
    log,
    decisionPath: buildDecisionPath(vulnerability, recommendation),
    confidence: vulnerability.confidence,
    recommendation
  };
}

function buildDecisionPath(vulnerability: Vulnerability, recommendation: Recommendation): DecisionPathStep[] {
  return [
    {
      label: "KEV",
      value: vulnerability.kev ? "Yes" : "No",
      tone: vulnerability.kev ? "ACT" : "neutral"
    },
    {
      label: "Threat Context",
      value: vulnerability.kev || vulnerability.epss >= 0.5 ? "Active / likely" : "Monitored",
      tone: vulnerability.kev ? "ACT" : vulnerability.epss >= 0.5 ? "ATTEND" : "TRACK"
    },
    {
      label: "Business Context",
      value: vulnerability.businessCritical ? `${vulnerability.tier}, critical` : vulnerability.tier,
      tone: vulnerability.businessCritical ? "ATTEND" : "TRACK"
    },
    {
      label: "SSVC Decision",
      value: recommendation,
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
