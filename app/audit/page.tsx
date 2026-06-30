"use client";

import { Clipboard, Copy, Filter, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AuditEntry } from "@/lib/types";
import { formatAuditDate, readAuditEntries } from "@/lib/audit";

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [copied, setCopied] = useState(false);

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

  async function copyLog() {
    const payload = entries
      .map(
        (entry) =>
          `${formatAuditDate(entry.timestamp)} | ${entry.cve} | rec=${entry.recommendation} | final=${entry.finalDecision} | override=${entry.override ? "yes" : "no"} | reason=${entry.reason}`
      )
      .join("\n");
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
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
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={copyLog}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy Audit Log"}
            </Button>
          </div>
        </div>

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
                {entries.map((entry) => (
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
          </div>
        </div>
      </div>
    </AppShell>
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
