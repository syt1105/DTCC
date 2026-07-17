"use client";

import testCvesData from "@/data/test-cves.json";
import validationData from "@/data/test-cves-validation.json";
import type { Recommendation, RtoTier, ThreatActorActivity, Vulnerability } from "@/lib/types";

export const REFRESH_FEED_STORAGE_KEY = "tva-demo-refresh-feed";
export const REFRESH_FEED_UPDATED_EVENT = "tva-refresh-feed-updated";

type ProtocolOutcome = Recommendation | "FILTERED";
type ThreatCategory = "none" | "active" | "targeted";

type ProtocolInput = {
  cvss: number;
  inKev: boolean;
  epss: number;
  threatCategory: ThreatCategory;
  rtoTier: number;
  internetFacing: boolean;
  compensatingControlsPresent: boolean;
};

type ProtocolEvaluation = {
  outcome: ProtocolOutcome;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  stage: number;
  reasoning: string[];
};

type SourceCve = {
  cve_id: string;
  published_date: string;
  last_modified: string;
  description: string;
  cwe: string;
  affected_products: string[];
  cvss_v3: { base_score: number; severity: string; vector: string };
  kev: { in_kev: boolean; kev_date_added?: string };
  epss: { epss_score: number; epss_percentile: number };
  threat_intel: {
    actively_relevant: boolean;
    signals: Array<{ type: string }>;
  };
  asset: {
    asset_id: string;
    asset_type: string;
    criticality_tier: RtoTier;
    internet_facing: boolean;
    production: boolean;
    compensating_controls: { present: boolean; description?: string };
  };
};

type ValidationRecord = {
  id: string;
  cveTitle: string;
};

export type RefreshFeedState = {
  batch: number;
  lastUpdated: string | null;
  vulnerabilities: Vulnerability[];
};

const sourceCves = (testCvesData as { cves: SourceCve[] }).cves;
const validationTitles = new Map(
  (validationData as ValidationRecord[]).map((item) => [item.id, item.cveTitle])
);
const refreshTemplates = sourceCves.filter((item) => item.cve_id !== "CVE-2024-3400").slice(0, 10);

export function readRefreshFeed(): RefreshFeedState {
  if (typeof window === "undefined") {
    return emptyRefreshFeed();
  }

  const stored = window.localStorage.getItem(REFRESH_FEED_STORAGE_KEY);
  if (!stored) return emptyRefreshFeed();

  try {
    const parsed = JSON.parse(stored) as Partial<RefreshFeedState>;
    return {
      batch: typeof parsed.batch === "number" ? parsed.batch : 0,
      lastUpdated: typeof parsed.lastUpdated === "string" ? parsed.lastUpdated : null,
      vulnerabilities: Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : []
    };
  } catch {
    return emptyRefreshFeed();
  }
}

export function refreshDemoFeed() {
  const current = readRefreshFeed();
  const nextBatchNumber = current.batch + 1;
  const generatedAt = new Date().toISOString();
  const generated = generateRefreshBatch(nextBatchNumber, generatedAt);
  const existingIds = new Set(current.vulnerabilities.map((item) => item.id));
  const next: RefreshFeedState = {
    batch: nextBatchNumber,
    lastUpdated: generatedAt,
    vulnerabilities: [
      ...generated.filter((item) => !existingIds.has(item.id)),
      ...current.vulnerabilities
    ]
  };

  window.localStorage.setItem(REFRESH_FEED_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(REFRESH_FEED_UPDATED_EVENT, {
      detail: { added: generated.length, lastUpdated: generatedAt }
    })
  );
  return { state: next, added: generated.length };
}

export function evaluateProtocolCascade(input: ProtocolInput): ProtocolEvaluation {
  const reasoning: string[] = [];

  if (input.cvss < 4) {
    return {
      outcome: "FILTERED",
      confidence: "HIGH",
      stage: 1,
      reasoning: [`Stage 1: CVSS ${input.cvss.toFixed(1)} is below 4.0; filtered from active scoring.`]
    };
  }

  reasoning.push(`Stage 1: CVSS ${input.cvss.toFixed(1)} is at or above 4.0; continue.`);

  let outcome: Recommendation;
  let confidence: ProtocolEvaluation["confidence"];
  let stage: number;

  if (input.inKev) {
    outcome = "ACT";
    confidence = "HIGH";
    stage = 2;
    reasoning.push("Stage 2: CISA KEV listing sets ACT with HIGH confidence.");
  } else if (input.epss >= 0.5) {
    outcome = "ACT";
    confidence = "MEDIUM";
    stage = 3;
    reasoning.push(`Stage 3: EPSS ${input.epss.toFixed(2)} is at or above 0.50; base outcome ACT.`);
  } else if (input.epss >= 0.1) {
    outcome = "ATTEND";
    confidence = "MEDIUM";
    stage = 3;
    reasoning.push(`Stage 3: EPSS ${input.epss.toFixed(2)} is between 0.10 and 0.50; base outcome ATTEND.`);
  } else {
    outcome = "TRACK";
    confidence = "LOW";
    stage = 3;
    reasoning.push(`Stage 3: EPSS ${input.epss.toFixed(2)} is below 0.10; base outcome TRACK.`);
  }

  if (input.threatCategory !== "none" && outcome !== "ACT") {
    outcome = outcome === "TRACK" ? "ATTEND" : "ACT";
    stage = 4;
    reasoning.push(`Stage 4: ${input.threatCategory} threat intelligence upgrades the outcome to ${outcome}.`);
  } else {
    reasoning.push(`Stage 4: ${input.threatCategory} threat intelligence does not change ${outcome}.`);
  }

  if ((input.rtoTier === 0 || input.rtoTier === 1) && outcome === "TRACK") {
    outcome = "ATTEND";
    stage = 5;
    reasoning.push(`Stage 5: RTO Tier ${input.rtoTier} upgrades TRACK to ATTEND.`);
  } else if ((input.rtoTier === 4 || input.rtoTier === 5) && outcome === "ACT" && !input.inKev) {
    outcome = "ATTEND";
    stage = 5;
    reasoning.push(`Stage 5: RTO Tier ${input.rtoTier} downgrades non-KEV ACT to ATTEND.`);
  } else {
    reasoning.push(`Stage 5: RTO Tier ${input.rtoTier} does not change ${outcome}.`);
  }

  if (input.internetFacing && !input.compensatingControlsPresent && outcome === "ATTEND") {
    outcome = "ACT";
    stage = 6;
    reasoning.push("Stage 6: internet-facing exposure without compensating controls upgrades ATTEND to ACT.");
  } else if (!input.internetFacing && input.compensatingControlsPresent && outcome === "ATTEND") {
    outcome = "TRACK";
    stage = 6;
    reasoning.push("Stage 6: internal exposure with compensating controls downgrades ATTEND to TRACK.");
  } else {
    reasoning.push(`Stage 6: exposure and controls do not change ${outcome}.`);
  }

  return { outcome, confidence, stage, reasoning };
}

function generateRefreshBatch(batch: number, generatedAt: string): Vulnerability[] {
  return refreshTemplates.flatMap((source, index) => {
    const rtoTier = parseRtoTier(source.asset.criticality_tier);
    const threatCategory = getThreatCategory(source);
    const evaluation = evaluateProtocolCascade({
      cvss: source.cvss_v3.base_score,
      inKev: source.kev.in_kev,
      epss: source.epss.epss_score,
      threatCategory,
      rtoTier,
      internetFacing: source.asset.internet_facing,
      compensatingControlsPresent: source.asset.compensating_controls.present
    });

    if (evaluation.outcome === "FILTERED") return [];

    const id = batch === 1 ? source.cve_id : `CVE-2026-${String(7001 + (batch - 2) * 10 + index).padStart(4, "0")}`;
    const product = source.affected_products[0] ?? titleCase(source.asset.asset_type);
    const threatActorActivity = toThreatActorActivity(threatCategory);
    const confidence = evaluation.confidence === "HIGH" ? 95 : evaluation.confidence === "MEDIUM" ? 84 : 72;

    return [{
      id,
      product,
      cveTitle: validationTitles.get(source.cve_id) ?? `${product} Security Vulnerability`,
      description: source.description,
      cvss: source.cvss_v3.base_score,
      cvssSource: "Synthetic protocol feed, CVSS v3.1",
      cvssVector: source.cvss_v3.vector,
      publishedDate: source.published_date,
      lastModified: source.last_modified,
      cwe: source.cwe,
      epss: source.epss.epss_score,
      epssPercentile: source.epss.epss_percentile,
      epssDate: generatedAt.slice(0, 10),
      kev: source.kev.in_kev,
      kevDateAdded: source.kev.kev_date_added ?? null,
      kevSource: "CISA Known Exploited Vulnerabilities Catalog (synthetic snapshot)",
      tier: source.asset.criticality_tier,
      businessUnit: titleCase(source.asset.asset_type),
      internetFacing: source.asset.internet_facing,
      businessCritical: rtoTier <= 2,
      missionDependency: rtoTier <= 1 ? "High" : rtoTier <= 3 ? "Medium" : "Low",
      threatActorActivity,
      recommendation: evaluation.outcome,
      confidence,
      vulnerableVersions: [`${product} versions identified by the synthetic refresh feed`],
      availableFixes: [
        "Apply the latest vendor fixed release or security update",
        source.asset.compensating_controls.present
          ? `Validate compensating control: ${source.asset.compensating_controls.description ?? "documented control"}`
          : "Add a compensating control if immediate remediation is blocked"
      ],
      workarounds: source.asset.compensating_controls.present
        ? [source.asset.compensating_controls.description ?? "Maintain the documented compensating control"]
        : ["Restrict network exposure until a fixed release is deployed"],
      remediationStatus: "Open",
      compensatingControlsPresent: source.asset.compensating_controls.present,
      compensatingControlsDescription: source.asset.compensating_controls.description,
      assetId: source.asset.asset_id,
      assetType: source.asset.asset_type,
      production: source.asset.production,
      threatIntelCategory: threatCategory,
      groundTruthOutcome: evaluation.outcome,
      groundTruthNotes: evaluation.reasoning.join(" "),
      protocolReasoningLog: evaluation.reasoning,
      protocolConfidence: evaluation.confidence,
      protocolStage: evaluation.stage,
      generatedAt,
      dataSource: "Demo Refresh Feed"
    } satisfies Vulnerability];
  });
}

function getThreatCategory(source: SourceCve): ThreatCategory {
  const signalTypes = source.threat_intel.signals.map((signal) => signal.type.toLowerCase());
  if (signalTypes.some((type) => type.includes("targeted") || type.includes("financial"))) return "targeted";
  if (
    signalTypes.some((type) => type.includes("active_exploitation") || type.includes("ransomware")) ||
    source.threat_intel.actively_relevant
  ) {
    return "active";
  }
  return "none";
}

function toThreatActorActivity(category: ThreatCategory): ThreatActorActivity {
  if (category === "targeted") return "FINANCIAL_SECTOR_TARGETING";
  if (category === "active") return "ACTIVE_EXPLOITATION";
  return "NO_KNOWN_ACTIVITY";
}

function parseRtoTier(value: RtoTier) {
  return Number(value.replace("Tier ", ""));
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function emptyRefreshFeed(): RefreshFeedState {
  return { batch: 0, lastUpdated: null, vulnerabilities: [] };
}
