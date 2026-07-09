import type { AuditEntry, Recommendation } from "@/lib/types";

export const AUDIT_STORAGE_KEY = "tva-review-audit-log";

export const seedAuditEntries: AuditEntry[] = [
  {
    id: "seed-1",
    timestamp: "2026-06-30T02:21:00.000Z",
    analyst: "Analyst A",
    cve: "CVE-2024-3400",
    recommendation: "ACT",
    finalDecision: "ACT",
    override: false,
    reason: "-",
    status: "Approved",
    decisionType: "AI Recommendation Retained",
    dtccSeverityScore: 100,
    dtccSeverityBand: "Critical",
    olaTarget: "24 hours",
    acceleratedRemediation: true
  },
  {
    id: "seed-2",
    timestamp: "2026-06-30T02:18:00.000Z",
    analyst: "Analyst B",
    cve: "CVE-2024-38812",
    recommendation: "ATTEND",
    finalDecision: "ATTEND",
    override: false,
    reason: "-",
    status: "Approved",
    decisionType: "AI Recommendation Retained",
    dtccSeverityScore: 63,
    dtccSeverityBand: "Medium",
    olaTarget: "30 days",
    acceleratedRemediation: false
  },
  {
    id: "seed-3",
    timestamp: "2026-06-30T02:15:00.000Z",
    analyst: "Analyst C",
    cve: "CVE-2024-47575",
    recommendation: "ATTEND",
    finalDecision: "ATTEND",
    override: false,
    reason: "-",
    status: "Approved",
    decisionType: "AI Recommendation Retained",
    dtccSeverityScore: 58,
    dtccSeverityBand: "Medium",
    olaTarget: "30 days",
    acceleratedRemediation: false
  },
  {
    id: "seed-4",
    timestamp: "2026-06-30T02:10:00.000Z",
    analyst: "Analyst B",
    cve: "CVE-2024-29824",
    recommendation: "ACT",
    finalDecision: "ATTEND",
    override: true,
    reason: "Maintenance Window",
    status: "Overridden",
    comments: "System maintenance window is scheduled.",
    decisionType: "Human Override",
    dtccSeverityScore: 100,
    dtccSeverityBand: "Critical",
    olaTarget: "24 hours",
    acceleratedRemediation: true
  }
];

export function readAuditEntries() {
  if (typeof window === "undefined") return seedAuditEntries;

  const stored = window.localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!stored) return seedAuditEntries;

  try {
    return JSON.parse(stored) as AuditEntry[];
  } catch {
    return seedAuditEntries;
  }
}

export function writeAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp" | "analyst">) {
  const entries = readAuditEntries();
  const next: AuditEntry = {
    ...entry,
    id: createAuditId(),
    timestamp: new Date().toISOString(),
    analyst: "Analyst A"
  };

  const updated = [next, ...entries];
  window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("tva-audit-updated"));
  return next;
}

function createAuditId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatAuditDate(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

export function recommendationLabel(value: Recommendation) {
  return value;
}
