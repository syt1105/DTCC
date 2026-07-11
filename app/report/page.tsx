"use client";

import { Printer, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AppShell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AuditEntry, SeverityBand } from "@/lib/types";
import { readAuditEntries } from "@/lib/audit";
import {
  deriveRecommendation,
  getGovernanceDecision,
  threatActorActivityLabel,
  vulnerabilities
} from "@/lib/vulnerabilities";

export default function WeeklyReportPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const load = () => setEntries(readAuditEntries());
    load();
    window.addEventListener("tva-audit-updated", load);
    return () => window.removeEventListener("tva-audit-updated", load);
  }, []);

  const report = useMemo(() => buildReport(entries), [entries]);

  async function shareReport() {
    const text = `Weekly Remediation Report: ${report.remediated} remediated, ${report.acceleratedClosed}/${report.acceleratedTotal} accelerated closed, ${report.olaAdherence}% OLA adherence.`;
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          description="Remediation activity, accelerated closures, and OLA adherence across the enterprise TVA program."
          eyebrow="Executive Summary · Jun 23 - Jun 30, 2026"
          title="Weekly Remediation Report"
          actions={
            <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print / PDF
            </Button>
            <Button onClick={shareReport}>
              <Share2 className="h-4 w-4" />
              {shared ? "Copied" : "Share with leadership"}
            </Button>
            </>
          }
        />

        <div className="rounded-[12px] border border-[#B9DED2] bg-greenLight/45 px-5 py-4 text-sm leading-6 text-navy">
          This week the program recorded <b>{report.remediated} remediated or approved decisions</b>, including{" "}
          <b>
            {report.acceleratedClosed} of {report.acceleratedTotal}
          </b>{" "}
          accelerated items within their 24-hour OLA. {report.newEnrichments} new CVEs were enriched for triage and{" "}
          {report.dismissed} non-applicable vulnerabilities were dismissed with rationale. Overall OLA adherence is{" "}
          <b>{report.olaAdherence}%</b>.
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Kpi value={report.remediated} label="CVEs remediated" detail="approved or closed" />
          <Kpi value={`${report.acceleratedClosed}/${report.acceleratedTotal}`} label="Accelerated closed" detail="24h OLA focus" tone="gold" />
          <Kpi value={report.newEnrichments} label="New enrichments" detail="triaged & queued" />
          <Kpi value={report.overrides} label="Human overrides" detail="governance retained" tone="orange" />
          <Kpi value={`${report.olaAdherence}%`} label="OLA adherence" detail="simulated PoC metric" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-5">
            <h2 className="text-base font-bold text-navy">Remediation activity by severity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Closures and active decisions this reporting period.</p>
            <div className="mt-6 space-y-4">
              {(["Critical", "High", "Medium", "Low"] as SeverityBand[]).map((severity) => (
                <SeverityBar
                  count={report.severityCounts[severity]}
                  key={severity}
                  label={severity}
                  max={report.maxSeverityCount}
                  tone={severity === "Critical" ? "red" : severity === "High" ? "orange" : severity === "Medium" ? "blue" : "green"}
                />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold text-navy">Threat context</h2>
            <p className="mt-1 text-sm text-muted-foreground">Across active PoC records.</p>
            <div className="mt-5 space-y-3">
              {report.threatStats.map((item) => (
                <div className="flex items-center justify-between rounded-[12px] border border-border bg-ceramic/60 px-4 py-3" key={item.label}>
                  <span className="text-sm font-semibold text-navy">{item.label}</span>
                  <Badge tone={item.tone}>{item.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-base font-bold text-navy">Notable remediation activity this week</h2>
          <div className="mt-4 divide-y divide-border">
            {report.notable.map((item) => (
              <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                <div>
                  <div className="font-bold text-starbucks">
                    {item.id} · {item.product}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div>
                </div>
                <Badge tone={item.tone}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-xs leading-5 text-muted-foreground">
          Generated from mock PoC data combining public CVE / CISA KEV / FIRST EPSS fields with simulated DTCC
          enterprise context. Not a live scanner or ticketing integration.
        </p>
      </div>
    </AppShell>
  );
}

function buildReport(entries: AuditEntry[]) {
  const approved = entries.filter((entry) => entry.status === "Approved").length;
  const dismissed = entries.filter((entry) => entry.status === "Dismissed").length;
  const overrides = entries.filter((entry) => entry.decisionType === "Human Override").length;
  const acceleratedEntries = entries.filter((entry) => entry.acceleratedRemediation);
  const acceleratedClosed = acceleratedEntries.filter((entry) => entry.status === "Approved").length;
  const acceleratedTotal = Math.max(acceleratedEntries.length, 1);
  const olaAdherence = Math.round(((approved + dismissed) / Math.max(entries.length, 1)) * 100);
  const severityCounts = vulnerabilities.reduce(
    (summary, vulnerability) => {
      const severity = getGovernanceDecision(vulnerability).severityBand;
      summary[severity] += 1;
      return summary;
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 } as Record<SeverityBand, number>
  );

  const threatMap = vulnerabilities.reduce<Record<string, number>>((summary, vulnerability) => {
    const label = threatActorActivityLabel(vulnerability.threatActorActivity);
    summary[label] = (summary[label] ?? 0) + 1;
    return summary;
  }, {});

  return {
    remediated: approved,
    dismissed,
    overrides,
    acceleratedClosed,
    acceleratedTotal,
    newEnrichments: 3,
    olaAdherence,
    severityCounts,
    maxSeverityCount: Math.max(...Object.values(severityCounts), 1),
    threatStats: [
      { label: "Financial-sector targeting", count: threatMap["Financial sector targeting"] ?? 0, tone: "red" as const },
      { label: "Active exploitation", count: threatMap["Active exploitation"] ?? 0, tone: "orange" as const },
      { label: "CISA KEV listed", count: vulnerabilities.filter((vulnerability) => vulnerability.kev).length, tone: "blue" as const },
      { label: "No known activity", count: threatMap["No known activity"] ?? 0, tone: "slate" as const }
    ],
    notable: vulnerabilities
      .slice(0, 4)
      .map((vulnerability) => ({
        id: vulnerability.id,
        product: vulnerability.product,
        detail:
          deriveRecommendation(vulnerability) === "ACT"
            ? "Accelerated remediation reviewed under 24h OLA."
            : "Scheduled remediation reviewed under standard OLA.",
        status: vulnerability.remediationStatus ?? (deriveRecommendation(vulnerability) === "ACT" ? "In Progress" : "Scheduled"),
        tone: (
          vulnerability.remediationStatus === "Remediated"
            ? "green"
            : deriveRecommendation(vulnerability) === "ACT"
              ? "red"
              : "blue"
        ) as "green" | "red" | "blue"
      }))
  };
}

function Kpi({
  detail,
  label,
  value,
  tone = "green"
}: {
  detail: string;
  label: string;
  value: string | number;
  tone?: "green" | "gold" | "orange";
}) {
  return (
    <Card className={`p-5 ${tone === "gold" ? "bg-[#FAF6EE]" : ""}`}>
      <div className="text-3xl font-bold text-navy">{value}</div>
      <div className="mt-2 text-sm font-bold text-navy">{label}</div>
      <div className={`mt-1 text-xs font-semibold ${tone === "orange" ? "text-attend" : tone === "gold" ? "text-[#8A6D1F]" : "text-track"}`}>
        {detail}
      </div>
    </Card>
  );
}

function SeverityBar({
  count,
  label,
  max,
  tone
}: {
  count: number;
  label: string;
  max: number;
  tone: "red" | "orange" | "blue" | "green";
}) {
  const fill =
    tone === "red"
      ? "bg-act"
      : tone === "orange"
        ? "bg-attend"
        : tone === "blue"
          ? "bg-greenAccent"
          : "bg-track";

  return (
    <div className="grid grid-cols-[84px_1fr_28px] items-center gap-3">
      <div className="text-sm font-semibold text-navy">{label}</div>
      <div className="h-2.5 rounded-full bg-ceramic">
        <div className={`h-2.5 rounded-full ${fill}`} style={{ width: `${Math.max(8, (count / max) * 100)}%` }} />
      </div>
      <div className="text-right text-sm font-bold text-navy">{count}</div>
    </div>
  );
}
