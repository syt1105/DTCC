"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChevronRight,
  Minus,
  Printer,
  Share2,
  X
} from "lucide-react";
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
  formatDateInput,
  formatPeriod,
  getMostRecentCompletePeriod,
  getPeriodContainingDate,
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

type Drilldown =
  | { kind: "severity"; severity: SeverityBand }
  | { kind: "reviewed" }
  | { kind: "ola" }
  | { kind: "discovered" }
  | { kind: "overrides" }
  | { kind: "dismissed" };

export default function ReviewReportPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>("weekly");
  const [selectedDate, setSelectedDate] = useState("");
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);
  const [shared, setShared] = useState(false);
  const referenceDate = useMemo(() => new Date(), []);

  useEffect(() => {
    const load = () => setEntries(readAuditEntries());
    load();
    window.addEventListener("tva-audit-updated", load);
    return () => window.removeEventListener("tva-audit-updated", load);
  }, []);

  const latestCompletePeriod = useMemo(
    () => getMostRecentCompletePeriod(timeframe, referenceDate),
    [referenceDate, timeframe]
  );
  const period = useMemo(() => {
    if (!selectedDate) return latestCompletePeriod;
    const selectedPeriod = getPeriodContainingDate(timeframe, parseDateInput(selectedDate));
    return selectedPeriod.end <= latestCompletePeriod.end ? selectedPeriod : latestCompletePeriod;
  }, [latestCompletePeriod, selectedDate, timeframe]);
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
    const text = `${timeframeLabels[timeframe]} Review Report (${formatPeriod(period)}): ${report.openCritical} open Critical, ${report.reviewed} reviewed, ${report.olaAdherence}% OLA adherence.`;
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
    setSelectedDate("");
    setDrilldown(null);
  }

  return (
    <AppShell>
      <ReportDrilldownDialog
        drilldown={drilldown}
        periodLabel={formatPeriod(period)}
        report={report}
        onClose={() => setDrilldown(null)}
      />

      <div className="space-y-6">
        <PageHeader
          description="Prioritized case review workload, decisions, and OLA performance for the selected complete reporting period."
          eyebrow={`Executive Summary · ${formatPeriod(period)}`}
          title={`${timeframeLabels[timeframe]} Review Report`}
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

        <div className="rounded-[12px] border border-border bg-white p-4 shadow-enterprise dark:bg-card">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-bold text-navy dark:text-white">Reporting timeframe</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a timeframe and any date within the completed week, fixed two-week period, or month.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              <label className="relative block">
                <span className="sr-only">Choose report date</span>
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="focus-ring h-11 rounded-full border border-input bg-white pl-10 pr-4 text-sm font-semibold text-navy dark:bg-card dark:text-white"
                  max={formatDateInput(latestCompletePeriod.end)}
                  type="date"
                  value={selectedDate || formatDateInput(latestCompletePeriod.end)}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setDrilldown(null);
                  }}
                />
              </label>
              {selectedDate ? (
                <Button size="sm" variant="ghost" onClick={() => setSelectedDate("")}>
                  Latest complete
                </Button>
              ) : null}
            </div>
          </div>
          <div className="mt-3 rounded-[10px] border border-[#B9DED2] bg-greenLight/30 px-3 py-2 text-xs font-semibold text-starbucks">
            Selected period: {formatPeriod(period)} · Compared with {formatPeriod(previousPeriod)}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Kpi
            delta={report.openCritical - previousReport.openCritical}
            deltaKind="risk"
            detail="unresolved at period end"
            label="Open Critical Cases"
            value={report.openCritical}
            onClick={() => setDrilldown({ kind: "severity", severity: "Critical" })}
          />
          <Kpi
            delta={report.reviewed - previousReport.reviewed}
            deltaKind="performance"
            detail="completed review in this period"
            label="Reviewed Cases"
            value={report.reviewed}
            onClick={() => setDrilldown({ kind: "reviewed" })}
          />
          <Kpi
            delta={report.olaAdherence - previousReport.olaAdherence}
            deltaKind="performance"
            detail={`${report.olaMet} of ${report.olaTotal} due cases met target`}
            label="Review OLA Adherence"
            suffix="%"
            value={report.olaAdherence}
            onClick={() => setDrilldown({ kind: "ola" })}
          />
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-navy dark:text-white">Period-over-Period Analysis</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Data-backed changes and case-level drivers for the selected review period.
                </p>
              </div>
              <div className="text-xs font-semibold text-muted-foreground">vs. {formatPeriod(previousPeriod)}</div>
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
            <p className="mt-1 text-sm text-muted-foreground">Point-in-time review inventory at the reporting period end.</p>
            <div className="mt-6 space-y-3">
              {(["Critical", "High", "Medium", "Low"] as SeverityBand[]).map((severity) => (
                <SeverityBar
                  count={report.severityCounts[severity]}
                  key={severity}
                  label={severity}
                  max={report.maxSeverityCount}
                  tone={severity === "Critical" ? "red" : severity === "High" ? "orange" : severity === "Medium" ? "blue" : "green"}
                  onClick={() => setDrilldown({ kind: "severity", severity })}
                />
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Select any severity to inspect its underlying cases.</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold text-navy dark:text-white">Secondary activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Supporting review signals for this period.</p>
            <div className="mt-5 space-y-3">
              <SecondaryMetric label="New cases enriched" value={report.discovered} onClick={() => setDrilldown({ kind: "discovered" })} />
              <SecondaryMetric label="Human overrides" value={report.overrides} onClick={() => setDrilldown({ kind: "overrides" })} />
              <SecondaryMetric label="Dismissed as not applicable" value={report.dismissed} onClick={() => setDrilldown({ kind: "dismissed" })} />
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-base font-bold text-navy dark:text-white">Notable review activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cases enriched or reviewed during this reporting period.</p>
          <div className="mt-4 divide-y divide-border">
            {report.activity.length ? (
              report.activity.map((item) => {
                const reviewedThisPeriod =
                  item.reviewedAt && item.reviewedAt >= period.start && item.reviewedAt <= period.end;
                return (
                  <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                    <div>
                      <Link className="font-bold text-starbucks hover:underline" href={`/cves/${item.id}`}>
                        {item.id} · {item.product}
                      </Link>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {reviewedThisPeriod
                          ? `Reviewed ${formatShortDate(item.reviewedAt!)}.`
                          : `Enriched ${formatShortDate(item.discoveredAt)} and added to the review inventory.`}
                      </div>
                    </div>
                    <Badge tone={reviewedThisPeriod ? "green" : item.severity === "Critical" ? "red" : "blue"}>
                      {reviewedThisPeriod ? "Reviewed" : item.severity}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No review activity was recorded for this period.</div>
            )}
          </div>
        </Card>

        <p className="text-xs leading-5 text-muted-foreground">
          Generated from mock PoC review history, public CVE / CISA KEV / FIRST EPSS fields, and simulated DTCC
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
  onClick
}: {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  delta: number;
  deltaKind: "risk" | "performance";
  onClick: () => void;
}) {
  const positive = deltaKind === "risk" ? delta < 0 : delta > 0;
  const negative = deltaKind === "risk" ? delta > 0 : delta < 0;
  const deltaClass = positive ? "text-track" : negative ? "text-act" : "text-muted-foreground";
  const DeltaIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;

  return (
    <button
      className="focus-ring rounded-[12px] border border-border bg-card p-5 text-left shadow-enterprise transition-all hover:-translate-y-0.5 hover:border-greenAccent hover:shadow-lg"
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-bold text-navy dark:text-white">{value}{suffix}</div>
          <div className="mt-2 text-sm font-bold text-navy dark:text-white">{label}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-starbucks" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
        <span className={`inline-flex items-center gap-1 ${deltaClass}`}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {delta === 0 ? "No change" : `${Math.abs(delta)}${suffix === "%" ? " pts" : ""}`}
        </span>
        <span className="text-muted-foreground">vs previous period · {detail}</span>
      </div>
    </button>
  );
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

function SecondaryMetric({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button
      className="focus-ring flex w-full items-center justify-between rounded-[12px] border border-border bg-ceramic/60 px-4 py-3 text-left transition-colors hover:border-greenAccent hover:bg-greenLight/35"
      type="button"
      onClick={onClick}
    >
      <span className="text-sm font-semibold text-navy dark:text-white">{label}</span>
      <span className="flex items-center gap-2">
        <Badge tone="blue">{value}</Badge>
        <ChevronRight className="h-4 w-4 text-starbucks" />
      </span>
    </button>
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
  onClick: () => void;
}) {
  const fill =
    tone === "red" ? "bg-act" : tone === "orange" ? "bg-attend" : tone === "blue" ? "bg-greenAccent" : "bg-track";

  return (
    <button
      className="focus-ring grid w-full grid-cols-[84px_1fr_28px_16px] items-center gap-3 rounded-[8px] px-1 py-1.5 text-left hover:bg-greenLight/30"
      type="button"
      onClick={onClick}
    >
      <div className="text-sm font-semibold text-navy dark:text-white">{label}</div>
      <div className="h-2.5 rounded-full bg-ceramic">
        <div className={`h-2.5 rounded-full ${fill}`} style={{ width: `${count ? Math.max(8, (count / max) * 100) : 0}%` }} />
      </div>
      <div className="text-right text-sm font-bold text-navy dark:text-white">{count}</div>
      <ChevronRight className="h-4 w-4 text-starbucks" />
    </button>
  );
}

function ReportDrilldownDialog({
  drilldown,
  report,
  periodLabel,
  onClose
}: {
  drilldown: Drilldown | null;
  report: PeriodReport;
  periodLabel: string;
  onClose: () => void;
}) {
  if (!drilldown) return null;

  const content = getDrilldownContent(drilldown, report);

  return (
    <div
      aria-labelledby="report-drilldown-title"
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
            <div className="text-xs font-bold uppercase tracking-wide text-starbucks">Review report detail</div>
            <h2 className="mt-1 text-xl font-bold text-navy dark:text-white" id="report-drilldown-title">{content.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{content.subtitle} · {periodLabel}</p>
          </div>
          <Button aria-label="Close report detail" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {content.cases.map((item) => (
            <ReportCaseCard context={drilldown.kind} item={item} key={item.id} />
          ))}
          {content.entries.map((entry) => (
            <AuditEntryCard entry={entry} key={entry.id} />
          ))}
          {!content.cases.length && !content.entries.length ? (
            <div className="rounded-[12px] border border-green-100 bg-green-50 p-5 text-sm font-semibold text-green-700">
              No matching records were found for this reporting period.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReportCaseCard({ item, context }: { item: ReportCase; context: Drilldown["kind"] }) {
  const reviewedOnTime = item.reviewedAt && item.reviewedAt <= item.dueAt;
  const badge =
    context === "reviewed"
      ? { label: "Reviewed", tone: "green" as const }
      : context === "ola"
        ? { label: reviewedOnTime ? "OLA met" : "OLA missed", tone: reviewedOnTime ? "green" as const : "red" as const }
        : context === "discovered"
          ? { label: item.severity, tone: severityTone(item.severity) }
          : { label: item.overdue ? "OLA overdue" : "Within OLA", tone: item.overdue ? "red" as const : "blue" as const };

  return (
    <div className="rounded-[12px] border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="font-bold text-starbucks hover:underline" href={`/cves/${item.id}`}>{item.id}</Link>
          <p className="mt-1 text-sm font-semibold text-navy dark:text-white">{item.product}</p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <CaseFact label="DTCC Severity" value={`${item.score} / 100 · ${item.severity}`} />
        <CaseFact label="Review OLA" value={`${item.olaTarget} · due ${formatShortDate(item.dueAt)}`} />
        <CaseFact label="Exposure" value={item.internetFacing ? "Internet-facing" : "Internal"} />
        <CaseFact label="Threat Activity" value={item.threatActivity} />
      </div>
      <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-starbucks hover:underline" href={`/cves/${item.id}`}>
        View case details
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function AuditEntryCard({ entry }: { entry: AuditEntry }) {
  return (
    <div className="rounded-[12px] border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="font-bold text-starbucks hover:underline" href={`/cves/${entry.cve}`}>{entry.cve}</Link>
          <p className="mt-1 text-sm text-muted-foreground">{entry.analyst} · {formatShortDate(new Date(entry.timestamp))}</p>
        </div>
        <Badge tone={entry.status === "Dismissed" ? "slate" : "orange"}>{entry.status}</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <CaseFact label="Decision" value={`${entry.recommendation} → ${entry.finalDecision}`} />
        <CaseFact label="Reason" value={entry.reason || "No reason recorded"} />
      </div>
      {entry.comments ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.comments}</p> : null}
    </div>
  );
}

function getDrilldownContent(drilldown: Drilldown, report: PeriodReport) {
  if (drilldown.kind === "severity") {
    return {
      title: `Open ${drilldown.severity} Cases`,
      subtitle: "Unresolved at the reporting period end",
      cases: report.openCases.filter((item) => item.severity === drilldown.severity),
      entries: [] as AuditEntry[]
    };
  }
  if (drilldown.kind === "reviewed") {
    return { title: "Reviewed Cases", subtitle: "Completed review in this period", cases: report.reviewedCases, entries: [] as AuditEntry[] };
  }
  if (drilldown.kind === "ola") {
    return { title: "Review OLA Cases", subtitle: "Cases with an OLA due in this period", cases: report.dueCases, entries: [] as AuditEntry[] };
  }
  if (drilldown.kind === "discovered") {
    return { title: "New Cases Enriched", subtitle: "Added to the review inventory in this period", cases: report.discoveredCases, entries: [] as AuditEntry[] };
  }
  if (drilldown.kind === "overrides") {
    return { title: "Human Overrides", subtitle: "Analyst overrides recorded in this period", cases: [] as ReportCase[], entries: report.overrideEntries };
  }
  return { title: "Dismissed as Not Applicable", subtitle: "Dismissals recorded in this period", cases: [] as ReportCase[], entries: report.dismissedEntries };
}

function CaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-ceramic/70 px-3 py-3">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-navy dark:text-white">{value}</div>
    </div>
  );
}

function severityTone(severity: SeverityBand) {
  if (severity === "Critical") return "red" as const;
  if (severity === "High") return "orange" as const;
  if (severity === "Medium") return "blue" as const;
  return "green" as const;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
