"use client";

import { Clipboard, Copy, Filter, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AuditEntry } from "@/lib/types";
import { formatAuditDate, readAuditEntries } from "@/lib/audit";

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AuditEntry["status"]>("ALL");
  const [overrideFilter, setOverrideFilter] = useState<"ALL" | "YES" | "NO">("ALL");

  useEffect(() => {
    const load = () => setEntries(readAuditEntries());
    load();
    window.addEventListener("tva-audit-updated", load);
    return () => window.removeEventListener("tva-audit-updated", load);
  }, []);

  const summary = useMemo(() => {
    const overridden = entries.filter((entry) => entry.override).length;
    const approved = entries.length - overridden;
    return {
      actions: entries.length,
      approved,
      overridden,
      coverage: entries.length ? "100%" : "0%"
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesQuery =
        !normalized ||
        entry.cve.toLowerCase().includes(normalized) ||
        entry.analyst.toLowerCase().includes(normalized) ||
        entry.reason.toLowerCase().includes(normalized) ||
        entry.recommendation.toLowerCase().includes(normalized) ||
        entry.finalDecision.toLowerCase().includes(normalized);

      const matchesStatus = statusFilter === "ALL" || entry.status === statusFilter;
      const matchesOverride =
        overrideFilter === "ALL" ||
        (overrideFilter === "YES" && entry.override) ||
        (overrideFilter === "NO" && !entry.override);

      return matchesQuery && matchesStatus && matchesOverride;
    });
  }, [entries, overrideFilter, query, statusFilter]);

  async function copyLog() {
    const payload = filteredEntries
      .map(
        (entry) =>
          `${formatAuditDate(entry.timestamp)} | ${entry.cve} | rec=${entry.recommendation} | final=${entry.finalDecision} | override=${entry.override ? "yes" : "no"} | reason=${entry.reason}`
      )
      .join("\n");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        copyWithFallback(payload);
      }
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      try {
        copyWithFallback(payload);
        setCopied(true);
        setCopyError(false);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        setCopyError(true);
        window.setTimeout(() => setCopyError(false), 2500);
      }
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-white">Audit Log</h1>
            <p className="mt-2 text-sm text-muted-foreground">All analyst actions are recorded for governance review.</p>
          </div>
          <div className="flex gap-2">
            <Button
              className={showFilters ? "border-blue-200 bg-blue-50 text-blue-700" : ""}
              variant="outline"
              onClick={() => setShowFilters((value) => !value)}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Filter"}
            </Button>
            <Button variant="outline" onClick={copyLog}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : copyError ? "Copy Failed" : "Copy Audit Log"}
            </Button>
          </div>
        </div>

        {showFilters ? (
          <Card className="p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground" htmlFor="audit-search">
                  Search
                </label>
                <Input
                  className="mt-2"
                  id="audit-search"
                  placeholder="CVE, analyst, reason, decision..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <FilterSelect
                label="Status"
                value={statusFilter}
                options={["ALL", "Approved", "Overridden"]}
                onChange={(value) => setStatusFilter(value as typeof statusFilter)}
              />
              <FilterSelect
                label="Override"
                value={overrideFilter}
                options={["ALL", "YES", "NO"]}
                onChange={(value) => setOverrideFilter(value as typeof overrideFilter)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("ALL");
                  setOverrideFilter("ALL");
                }}
              >
                Clear
              </Button>
            </div>
            <div className="mt-3 text-xs font-semibold text-muted-foreground">
              Showing {filteredEntries.length} of {entries.length} audit records. Copy exports the current filtered view.
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <AuditMetric icon={Clipboard} label="Actions" value={summary.actions} />
          <AuditMetric icon={ShieldCheck} label="Approved" tone="green" value={summary.approved} />
          <AuditMetric icon={TriangleAlert} label="Overridden" tone="orange" value={summary.overridden} />
          <AuditMetric icon={ShieldCheck} label="Audit Coverage" tone="blue" value={summary.coverage} />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-enterprise dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-slate-500">
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">Analyst</th>
                  <th className="px-5 py-4">CVE</th>
                  <th className="px-5 py-4">Recommendation</th>
                  <th className="px-5 py-4">Final Decision</th>
                  <th className="px-5 py-4">Override?</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr className="border-b border-border last:border-b-0" key={entry.id}>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{formatAuditDate(entry.timestamp)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-navy dark:text-white">{entry.analyst}</td>
                    <td className="px-5 py-4 text-sm font-bold text-blue-700">{entry.cve}</td>
                    <td className="px-5 py-4">
                      <RecommendationBadge value={entry.recommendation} />
                    </td>
                    <td className="px-5 py-4">
                      <RecommendationBadge value={entry.finalDecision} />
                    </td>
                    <td className="px-5 py-4 text-sm">{entry.override ? "Yes" : "No"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{entry.reason}</td>
                    <td className="px-5 py-4">
                      <Badge tone={entry.status === "Approved" ? "green" : "orange"}>{entry.status}</Badge>
                    </td>
                  </tr>
                ))}
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
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase text-muted-foreground">{label}</label>
      <select
        className="focus-ring mt-2 h-10 min-w-36 rounded-md border border-input bg-white px-3 text-sm font-semibold text-navy dark:bg-card dark:text-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function AuditMetric({
  icon: Icon,
  label,
  value,
  tone = "blue"
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "blue" | "green" | "orange";
}) {
  const toneClass =
    tone === "green" ? "bg-green-50 text-track" : tone === "orange" ? "bg-orange-50 text-attend" : "bg-blue-50 text-blue-700";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-navy dark:text-white">{value}</div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">{label}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
