"use client";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Filter,
  Search,
  Shield,
  ShieldCheck,
  TriangleAlert,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AuditEntry } from "@/lib/types";
import { readAuditEntries } from "@/lib/audit";
import { getGovernanceDecision, getVulnerability } from "@/lib/vulnerabilities";

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [query, setQuery] = useState("");
  const [decisionTypeFilter, setDecisionTypeFilter] = useState<"ALL" | NonNullable<AuditEntry["decisionType"]>>("ALL");
  const [tierFilter, setTierFilter] = useState<"ALL" | "Tier 1" | "Tier 2" | "Tier 3">("ALL");

  useEffect(() => {
    const load = () => setEntries(readAuditEntries());
    load();
    window.addEventListener("tva-audit-updated", load);
    return () => window.removeEventListener("tva-audit-updated", load);
  }, []);

  const summary = useMemo(() => {
    const overridden = entries.filter((entry) => entry.override).length;
    const accelerated = entries.filter((entry) => getAuditContext(entry).acceleratedRemediation).length;
    const approved = entries.filter((entry) => entry.status === "Approved").length;
    return {
      actions: entries.length,
      approved,
      overridden,
      accelerated,
      auditCoverage: entries.length > 0 ? 100 : 0
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const context = getAuditContext(entry);
      const matchesQuery =
        !normalized ||
        entry.cve.toLowerCase().includes(normalized) ||
        entry.reason.toLowerCase().includes(normalized) ||
        entry.recommendation.toLowerCase().includes(normalized) ||
        entry.finalDecision.toLowerCase().includes(normalized) ||
        (entry.decisionType ?? (entry.override ? "Human Override" : "AI Recommendation Retained")).toLowerCase().includes(normalized) ||
        context.severityBand.toLowerCase().includes(normalized) ||
        context.olaTarget.toLowerCase().includes(normalized);

      const vulnerability = getVulnerability(entry.cve);
      const decisionType = entry.decisionType ?? (entry.override ? "Human Override" : "AI Recommendation Retained");
      const matchesDecisionType = decisionTypeFilter === "ALL" || decisionType === decisionTypeFilter;
      const matchesTier = tierFilter === "ALL" || vulnerability?.tier === tierFilter;

      return matchesQuery && matchesDecisionType && matchesTier;
    });
  }, [decisionTypeFilter, entries, query, tierFilter]);

  async function exportLog() {
    const payload = JSON.stringify(
      filteredEntries.map((entry) => ({
        ...entry,
        context: getAuditContext(entry),
        vulnerability: getVulnerability(entry.cve)?.product ?? "Unknown product"
      })),
      null,
      2
    );

    try {
      const blob = new Blob([payload], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tva-audit-log.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setExported(true);
      setExportError(false);
      window.setTimeout(() => setExported(false), 1800);
    } catch {
      try {
        copyWithFallback(payload);
        setExported(true);
        setExportError(false);
        window.setTimeout(() => setExported(false), 1800);
      } catch {
        setExportError(true);
        window.setTimeout(() => setExportError(false), 2500);
      }
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-white">Audit Log</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              All analyst actions are securely recorded for governance and compliance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className={showFilters ? "border-[#B9DED2] bg-greenLight/60 text-starbucks" : ""}
              variant="outline"
              onClick={() => setShowFilters((value) => !value)}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button onClick={exportLog}>
              <Download className="h-4 w-4" />
              {exported ? "Exported" : exportError ? "Export Failed" : "Export Log"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <AuditMetric
            description="All analyst activities"
            icon={BarChart3}
            label="Total Actions"
            value={summary.actions}
          />
          <AuditMetric
            description={`${formatPercent(summary.approved, summary.actions)} of total actions`}
            icon={ShieldCheck}
            label="Approved"
            tone="green"
            value={summary.approved}
          />
          <AuditMetric
            description={`${formatPercent(summary.overridden, summary.actions)} of total actions`}
            icon={TriangleAlert}
            label="Overridden"
            tone="orange"
            value={summary.overridden}
          />
          <AuditMetric
            description={`${formatPercent(summary.accelerated, summary.actions)} of total actions`}
            icon={Clock3}
            label="Accelerated"
            tone="green"
            value={summary.accelerated}
          />
          <AuditMetric
            description="Fully logged"
            icon={Shield}
            label="Audit Coverage"
            value={`${summary.auditCoverage}%`}
          />
        </div>

        {showFilters ? (
          <div className="grid gap-3 xl:grid-cols-[1.8fr_0.95fr_0.8fr_1.05fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 rounded-[12px] pl-12"
                id="audit-search"
                placeholder="Search by CVE, reason, decision, severity, or OLA..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <FilterSelect
              ariaLabel="Decision type filter"
              value={decisionTypeFilter}
              options={["ALL", "AI Recommendation Retained", "Human Override"]}
              labels={{
                ALL: "All Decision Types",
                "AI Recommendation Retained": "AI Retained",
                "Human Override": "Human Override"
              }}
              onChange={(value) => setDecisionTypeFilter(value as typeof decisionTypeFilter)}
            />
            <FilterSelect
              ariaLabel="Tier filter"
              value={tierFilter}
              options={["ALL", "Tier 1", "Tier 2", "Tier 3"]}
              labels={{ ALL: "All Tiers" }}
              onChange={(value) => setTierFilter(value as typeof tierFilter)}
            />
            <div className="flex h-12 items-center justify-center gap-3 rounded-[12px] border border-input bg-white px-4 text-sm font-semibold text-navy shadow-enterprise dark:bg-card dark:text-white">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span>Jun 23 - Jun 30, 2026</span>
              <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-enterprise dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] text-center">
              <thead>
                <tr className="border-b border-border bg-greenLight/20 text-xs font-bold text-slate-600">
                  <th className="px-4 py-5 text-center">Timestamp</th>
                  <th className="px-4 py-5 text-center">CVE</th>
                  <th className="px-4 py-5 text-center">Severity / OLA</th>
                  <th className="px-4 py-5 text-center">Recommendation</th>
                  <th className="px-4 py-5 text-center">Final Decision</th>
                  <th className="px-4 py-5 text-center">Decision Type</th>
                  <th className="px-4 py-5 text-center">Override?</th>
                  <th className="px-4 py-5 text-center">Reason</th>
                  <th className="px-4 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const context = getAuditContext(entry);
                  const vulnerability = getVulnerability(entry.cve);
                  const timestamp = formatTimestampParts(entry.timestamp);
                  return (
                    <tr className="border-b border-border last:border-b-0" key={entry.id}>
                      <td className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{timestamp.date}</div>
                        <div className="mt-1 text-xs">{timestamp.time}</div>
                      </td>
                      <td className="px-4 py-6 text-center text-sm">
                        <div className="font-bold text-starbucks">{entry.cve}</div>
                        <div className="mt-1 text-xs font-medium text-slate-500">{vulnerability?.product ?? "Unknown product"}</div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <div className="text-sm font-bold text-navy dark:text-white">
                          {context.severityScore} / {context.severityBand}
                        </div>
                        <div className="mt-2 flex justify-center">
                          <Badge tone={context.acceleratedRemediation ? "red" : "blue"}>{context.olaTarget}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <RecommendationBadge value={entry.recommendation} />
                      </td>
                      <td className="px-4 py-6 text-center">
                        <RecommendationBadge value={entry.finalDecision} />
                      </td>
                      <td className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-300">
                        <DecisionTypeCell entry={entry} />
                      </td>
                      <td className="px-4 py-6 text-center text-sm font-medium text-navy dark:text-white">
                        {entry.override ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-300">{entry.reason}</td>
                      <td className="px-4 py-6 text-center">
                        <Badge tone={entry.status === "Approved" ? "green" : "orange"}>{entry.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredEntries.length === 0 ? (
              <div className="border-t border-border px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                No audit records match the current filters.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function getAuditContext(entry: AuditEntry) {
  const vulnerability = getVulnerability(entry.cve);
  const derived = vulnerability ? getGovernanceDecision(vulnerability) : null;

  return {
    severityScore: entry.dtccSeverityScore ?? derived?.score ?? 0,
    severityBand: entry.dtccSeverityBand ?? derived?.severityBand ?? "Low",
    olaTarget: entry.olaTarget ?? derived?.olaTarget ?? "Next cycle",
    acceleratedRemediation: entry.acceleratedRemediation ?? derived?.acceleratedRemediation ?? false
  };
}

function copyWithFallback(payload: string) {
  const textarea = document.createElement("textarea");
  textarea.value = payload;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!ok) {
    throw new Error("Copy command failed");
  }
}

function FilterSelect({
  ariaLabel,
  value,
  options,
  labels = {},
  onChange
}: {
  ariaLabel: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        className="focus-ring h-12 w-full appearance-none rounded-[12px] border border-input bg-white px-4 pr-10 text-center text-sm font-semibold text-navy shadow-enterprise dark:bg-card dark:text-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function AuditMetric({
  description,
  icon: Icon,
  label,
  value,
  tone = "blue"
}: {
  description: string;
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "blue" | "green" | "orange";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-track"
      : tone === "orange"
        ? "bg-orange-50 text-attend"
        : "bg-greenLight/60 text-starbucks";
  const descriptionClass =
    tone === "green"
      ? "text-track"
      : tone === "orange"
        ? "text-attend"
        : "text-starbucks";

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] ${toneClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold text-navy dark:text-white">{value}</div>
          <div className="mt-2 text-sm font-bold text-navy dark:text-white">{label}</div>
          <div className={`mt-1 text-xs font-medium ${descriptionClass}`}>{description}</div>
        </div>
      </div>
    </Card>
  );
}

function DecisionTypeCell({ entry }: { entry: AuditEntry }) {
  const retained = (entry.decisionType ?? (entry.override ? "Human Override" : "AI Recommendation Retained")) === "AI Recommendation Retained";

  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={
          retained
            ? "grid h-8 w-8 place-items-center rounded-full border border-green-100 bg-green-50 text-track"
            : "grid h-8 w-8 place-items-center rounded-full border border-orange-100 bg-orange-50 text-attend"
        }
      >
        {retained ? <CheckCircle2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
      </span>
      <span className="max-w-32 text-center leading-5">
        {retained ? (
          <>
            AI Recommendation
            <br />
            Retained
          </>
        ) : (
          "Human Override"
        )}
      </span>
    </div>
  );
}

function formatPercent(value: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function formatTimestampParts(timestamp: string) {
  const date = new Date(timestamp);

  return {
    date: new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date),
    time: new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date)
  };
}
