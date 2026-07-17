"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, ChevronRight, Minus, Printer, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AppShell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readAuditEntries } from "@/lib/audit";
import {
  buildPeriodReport,
  buildReportInsights,
  formatPeriod,
  getMostRecentCompletePeriod,
  getPreviousPeriod,
  type PeriodReport,
  type ReportCase,
  type ReportInsight,
  type ReportTimeframe
} from "@/lib/reporting";
import type { AuditEntry, SeverityBand } from "@/lib/types";
import { vulnerabilities } from "@/lib/vulnerabilities";

const timeframeLabels: Record<ReportTimeframe, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly"
};

export default function RemediationReportPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>("weekly");
  const [criticalCasesOpen, setCriticalCasesOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const referenceDate = useMemo(() => new Date(), []);

  useEffect(() => {
    const load = () => setEntries(readAuditEntries());
    load();
    window.addEventListener("tva-audit-updated", load);
    return () => window.removeEventListener("tva-audit-updated", load);
  }, []);

  const period = useMemo(
    () => getMostRecentCompletePeriod(timeframe, referenceDate),
    [referenceDate, timeframe]
  );
  const previousPeriod = useMemo(() => getPreviousPeriod(period, timeframe), [period, timeframe]);
  const report = useMemo(() => buildPeriodReport(vulnerabilities, entries, period), [entries, period]);
  const previousReport = useMemo(
    () => buildPeriodReport(vulnerabilities, entries, previousPeriod),
    [entries, previousPeriod]
  );
  const insights = useMemo(
    () => buildReportInsights(report, previousReport),
    [previousReport, report]
  );

  async function shareReport() {
    const text = `${timeframeLabels[timeframe]} Remediation Report (${formatPeriod(period)}): ${report.openCritical} open Critical, ${report.remediated} remediated, ${report.olaAdherence}% OLA adherence.`;
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }

  function selectTimeframe(value: ReportTimeframe) {
    setTimeframe(value);
    setCriticalCasesOpen(false);
  }

  return (
    <AppShell>
      <CriticalCasesDialog
        cases={report.openCriticalCases}
        open={criticalCasesOpen}
        periodLabel={formatPeriod(period)}
        onClose={() => setCriticalCasesOpen(false)}
      />

      <div className="space-y-6">
        <PageHeader
          description="Prioritized remediation risk, delivery, and OLA performance for the most recent complete reporting period."
          eyebrow={`Executive Summary · ${formatPeriod(period)}`}
          title={`${timeframeLabels[timeframe]} Remediation Report`}
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

        <div className="flex flex-col gap-3 rounded-[12px] border border-border bg-white p-4 shadow-enterprise sm:flex-row sm:items-center sm:justify-between dark:bg-card">
          <div>
            <div className="text-sm font-bold text-navy dark:text-white">Reporting timeframe</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing the most recent complete period and comparing it with the immediately preceding period.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-full border border-border bg-ceramic p-1" aria-label="Reporting timeframe">
            {(Object.keys(timeframeLabels) as ReportTimeframe[]).map((value) => (
              <button
                aria-pressed={timeframe === value}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  timeframe === value
                    ? "bg-navy text-white shadow-sm"
                    : "text-muted-foreground hover:bg-white hover:text-navy"
                }`}
                key={value}
                type="button"
                onClick={() => selectTimeframe(value)}
              >
                {timeframeLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Kpi
            clickable
            delta={report.openCritical - previousReport.openCritical}
            deltaKind="risk"
            detail="unresolved at period end"
            label="Open Critical Cases"
            value={report.openCritical}
            onClick={() => setCriticalCasesOpen(true)}
          />
          <Kpi
            delta={report.remediated - previousReport.remediated}
            deltaKind="performance"
            detail="completed in this period"
            label="Remediated"
            value={report.remediated}
          />
          <Kpi
            delta={report.olaAdherence - previousReport.olaAdherence}
            deltaKind="performance"
            detail={`${report.olaMet} of ${report.olaTotal} due cases met target`}
            label="OLA Adherence"
            suffix="%"
            value={report.olaAdherence}
          />
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-navy dark:text-white">Period-over-Period Analysis</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Data-backed changes and case-level drivers for the selected timeframe.
                </p>
              </div>
              <div className="text-xs font-semibold text-muted-foreground">
                vs. {formatPeriod(previousPeriod)}
              </div>
            </div>
          </div>
          <div className="grid divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {insights.map((insight) => (
              <Insight key={insight.title} insight={insight} />
            ))}
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-5">
            <h2 className="text-base font-bold text-navy dark:text-white">Open cases by severity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Point-in-time inventory at the reporting period end.</p>
            <div className="mt-6 space-y-4">
              {(["Critical", "High", "Medium", "Low"] as SeverityBand[]).map((severity) => (
                <SeverityBar
                  count={report.severityCounts[severity]}
                  key={severity}
                  label={severity}
                  max={report.maxSeverityCount}
                  tone={severity === "Critical" ? "red" : severity === "High" ? "orange" : severity === "Medium" ? "blue" : "green"}
                  onClick={severity === "Critical" ? () => setCriticalCasesOpen(true) : undefined}
                />
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Select Critical to inspect the underlying cases.</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold text-navy dark:text-white">Secondary activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Supporting operational signals for this period.</p>
            <div className="mt-5 space-y-3">
              <SecondaryMetric label="New cases enriched" value={report.discovered} />
              <SecondaryMetric label="Human overrides" value={report.overrides} />
              <SecondaryMetric label="Dismissed as not applicable" value={report.dismissed} />
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-base font-bold text-navy dark:text-white">Notable case activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cases discovered or remediated during this reporting period.</p>
          <div className="mt-4 divide-y divide-border">
            {report.activity.length ? (
              report.activity.map((item) => {
                const remediatedThisPeriod =
                  item.remediatedAt && item.remediatedAt >= period.start && item.remediatedAt <= period.end;
                return (
                  <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                    <div>
                      <Link className="font-bold text-starbucks hover:underline" href={`/cves/${item.id}`}>
                        {item.id} · {item.product}
                      </Link>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {remediatedThisPeriod
                          ? `Remediated ${formatShortDate(item.remediatedAt!)}.`
                          : `Enriched ${formatShortDate(item.discoveredAt)} and added to the active inventory.`}
                      </div>
                    </div>
                    <Badge tone={remediatedThisPeriod ? "green" : item.severity === "Critical" ? "red" : "blue"}>
                      {remediatedThisPeriod ? "Remediated" : item.severity}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No case activity was recorded for this period.</div>
            )}
          </div>
        </Card>

        <p className="text-xs leading-5 text-muted-foreground">
          Generated from mock PoC lifecycle history, public CVE / CISA KEV / FIRST EPSS fields, and simulated DTCC
          enterprise context. Causal statements are limited to case-level changes represented in the data.
        </p>
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  suffix,
  detail,
  delta,
  deltaKind,
  clickable = false,
  onClick
}: {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  delta: number;
  deltaKind: "risk" | "performance";
  clickable?: boolean;
  onClick?: () => void;
}) {
  const positive = deltaKind === "risk" ? delta < 0 : delta > 0;
  const negative = deltaKind === "risk" ? delta > 0 : delta < 0;
  const deltaClass = positive ? "text-track" : negative ? "text-act" : "text-muted-foreground";
  const DeltaIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-bold text-navy dark:text-white">
            {value}{suffix}
          </div>
          <div className="mt-2 text-sm font-bold text-navy dark:text-white">{label}</div>
        </div>
        {clickable ? <ChevronRight className="h-5 w-5 text-starbucks" /> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
        <span className={`inline-flex items-center gap-1 ${deltaClass}`}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {delta === 0 ? "No change" : `${Math.abs(delta)}${suffix === "%" ? " pts" : ""}`}
        </span>
        <span className="text-muted-foreground">vs previous period · {detail}</span>
      </div>
    </>
  );

  if (clickable) {
    return (
      <button
        className="focus-ring rounded-[12px] border border-border bg-card p-5 text-left shadow-enterprise transition-all hover:-translate-y-0.5 hover:border-greenAccent hover:shadow-lg"
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <Card className="p-5">{content}</Card>;
}

function Insight({ insight }: { insight: ReportInsight }) {
  const tone =
    insight.tone === "positive"
      ? "border-green-100 bg-green-50 text-green-700"
      : insight.tone === "negative"
        ? "border-red-100 bg-red-50 text-red-700"
        : "border-stone-200 bg-stone-50 text-stone-600";

  return (
    <div className="p-5">
      <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>
        {insight.tone === "positive" ? "Improved" : insight.tone === "negative" ? "Needs attention" : "Stable"}
      </div>
      <h3 className="mt-3 text-sm font-bold text-navy dark:text-white">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
    </div>
  );
}

function SecondaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[12px] border border-border bg-ceramic/60 px-4 py-3">
      <span className="text-sm font-semibold text-navy dark:text-white">{label}</span>
      <Badge tone="blue">{value}</Badge>
    </div>
  );
}

function SeverityBar({
  count,
  label,
  max,
  tone,
  onClick
}: {
  count: number;
  label: string;
  max: number;
  tone: "red" | "orange" | "blue" | "green";
  onClick?: () => void;
}) {
  const fill =
    tone === "red"
      ? "bg-act"
      : tone === "orange"
        ? "bg-attend"
        : tone === "blue"
          ? "bg-greenAccent"
          : "bg-track";
  const content = (
    <>
      <div className="text-sm font-semibold text-navy dark:text-white">{label}</div>
      <div className="h-2.5 rounded-full bg-ceramic">
        <div className={`h-2.5 rounded-full ${fill}`} style={{ width: `${count ? Math.max(8, (count / max) * 100) : 0}%` }} />
      </div>
      <div className="text-right text-sm font-bold text-navy dark:text-white">{count}</div>
      {onClick ? <ChevronRight className="h-4 w-4 text-starbucks" /> : <span />}
    </>
  );

  if (onClick) {
    return (
      <button
        className="focus-ring grid w-full grid-cols-[84px_1fr_28px_16px] items-center gap-3 rounded-[8px] text-left hover:bg-greenLight/30"
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className="grid grid-cols-[84px_1fr_28px_16px] items-center gap-3">{content}</div>;
}

function CriticalCasesDialog({
  cases,
  open,
  periodLabel,
  onClose
}: {
  cases: ReportCase[];
  open: boolean;
  periodLabel: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      aria-labelledby="critical-cases-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-navy/60 backdrop-blur-sm"
      role="dialog"
      onMouseDown={onClose}
    >
      <div
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-white p-6 shadow-2xl dark:bg-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-act">Critical exposure</div>
            <h2 className="mt-1 text-xl font-bold text-navy dark:text-white" id="critical-cases-title">
              Open Critical Cases
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Unresolved as of {periodLabel}.</p>
          </div>
          <Button aria-label="Close Critical cases" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {cases.length ? (
            cases.map((item) => (
              <div className="rounded-[12px] border border-border p-4" key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link className="font-bold text-starbucks hover:underline" href={`/cves/${item.id}`}>
                      {item.id}
                    </Link>
                    <p className="mt-1 text-sm font-semibold text-navy dark:text-white">{item.product}</p>
                  </div>
                  <Badge tone={item.overdue ? "red" : "orange"}>{item.overdue ? "OLA overdue" : "Within OLA"}</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <CaseFact label="DTCC Severity" value={`${item.score} / 100 · ${item.severity}`} />
                  <CaseFact label="OLA Target" value={`${item.olaTarget} · due ${formatShortDate(item.dueAt)}`} />
                  <CaseFact label="Exposure" value={item.internetFacing ? "Internet-facing" : "Internal"} />
                  <CaseFact label="Threat Activity" value={item.threatActivity} />
                </div>
                <Link
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-starbucks hover:underline"
                  href={`/cves/${item.id}`}
                >
                  View case details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))
          ) : (
            <div className="rounded-[12px] border border-green-100 bg-green-50 p-5 text-sm font-semibold text-green-700">
              No Critical cases were open at the end of this reporting period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-ceramic/70 px-3 py-3">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-navy dark:text-white">{value}</div>
    </div>
  );
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
