import type { AuditEntry, SeverityBand, Vulnerability } from "@/lib/types";
import { getGovernanceDecision } from "@/lib/vulnerabilities";

export type ReportTimeframe = "weekly" | "biweekly" | "monthly";

export type ReportPeriod = {
  start: Date;
  end: Date;
};

type ReportCaseHistory = {
  cve: string;
  discoveredAt: string;
  dueAt: string;
  reviewedAt?: string;
};

export type ReportCase = {
  id: string;
  product: string;
  severity: SeverityBand;
  score: number;
  status: "Open" | "Reviewed";
  olaTarget: string;
  internetFacing: boolean;
  threatActivity: string;
  dueAt: Date;
  discoveredAt: Date;
  reviewedAt: Date | null;
  overdue: boolean;
};

export type ReportInsight = {
  title: string;
  detail: string;
  tone: "positive" | "negative" | "neutral";
};

export type PeriodReport = {
  openCritical: number;
  openCriticalCases: ReportCase[];
  openCases: ReportCase[];
  reviewed: number;
  reviewedCases: ReportCase[];
  olaAdherence: number;
  olaMet: number;
  olaTotal: number;
  dueCases: ReportCase[];
  missedOlaCases: ReportCase[];
  severityCounts: Record<SeverityBand, number>;
  maxSeverityCount: number;
  discovered: number;
  discoveredCases: ReportCase[];
  overrides: number;
  overrideEntries: AuditEntry[];
  dismissed: number;
  dismissedEntries: AuditEntry[];
  activity: ReportCase[];
};

// Mock point-in-time history for the PoC. These dates make period comparisons
// reproducible while the app is not connected to a scanner or ticketing system.
const reportCaseHistory: ReportCaseHistory[] = [
  { cve: "CVE-2024-3400", discoveredAt: "2026-05-04T12:00:00.000Z", dueAt: "2026-05-05T12:00:00.000Z", reviewedAt: "2026-06-20T12:00:00.000Z" },
  { cve: "CVE-2024-21762", discoveredAt: "2026-06-29T12:00:00.000Z", dueAt: "2026-07-12T12:00:00.000Z", reviewedAt: "2026-07-11T12:00:00.000Z" },
  { cve: "CVE-2024-38812", discoveredAt: "2026-05-22T12:00:00.000Z", dueAt: "2026-06-21T12:00:00.000Z", reviewedAt: "2026-06-18T12:00:00.000Z" },
  { cve: "CVE-2024-47575", discoveredAt: "2026-06-03T12:00:00.000Z", dueAt: "2026-07-03T12:00:00.000Z", reviewedAt: "2026-07-02T12:00:00.000Z" },
  { cve: "CVE-2024-29824", discoveredAt: "2026-06-18T12:00:00.000Z", dueAt: "2026-06-29T12:00:00.000Z" },
  { cve: "CVE-2024-20353", discoveredAt: "2026-05-12T12:00:00.000Z", dueAt: "2026-06-11T12:00:00.000Z", reviewedAt: "2026-06-10T12:00:00.000Z" },
  { cve: "CVE-2023-34362", discoveredAt: "2026-05-10T12:00:00.000Z", dueAt: "2026-05-11T12:00:00.000Z", reviewedAt: "2026-06-05T12:00:00.000Z" },
  { cve: "CVE-2024-3094", discoveredAt: "2026-05-18T12:00:00.000Z", dueAt: "2026-06-15T12:00:00.000Z", reviewedAt: "2026-06-14T12:00:00.000Z" },
  { cve: "CVE-2023-4966", discoveredAt: "2026-05-26T12:00:00.000Z", dueAt: "2026-07-01T12:00:00.000Z", reviewedAt: "2026-07-09T12:00:00.000Z" },
  { cve: "CVE-2024-5806", discoveredAt: "2026-06-04T12:00:00.000Z", dueAt: "2026-07-05T12:00:00.000Z", reviewedAt: "2026-07-04T12:00:00.000Z" },
  { cve: "CVE-2024-6387", discoveredAt: "2026-06-08T12:00:00.000Z", dueAt: "2026-07-10T12:00:00.000Z", reviewedAt: "2026-07-07T12:00:00.000Z" },
  { cve: "CVE-2024-1086", discoveredAt: "2026-05-07T12:00:00.000Z", dueAt: "2026-06-30T12:00:00.000Z", reviewedAt: "2026-06-28T12:00:00.000Z" },
  { cve: "CVE-2024-24919", discoveredAt: "2026-07-08T12:00:00.000Z", dueAt: "2026-07-11T12:00:00.000Z" },
  { cve: "CVE-2024-27198", discoveredAt: "2026-05-14T12:00:00.000Z", dueAt: "2026-05-21T12:00:00.000Z", reviewedAt: "2026-05-20T12:00:00.000Z" },
  { cve: "CVE-2024-4577", discoveredAt: "2026-05-28T12:00:00.000Z", dueAt: "2026-06-27T12:00:00.000Z", reviewedAt: "2026-06-25T12:00:00.000Z" }
];

const timeframeDays: Record<Exclude<ReportTimeframe, "monthly">, number> = {
  weekly: 7,
  biweekly: 14
};

export function getMostRecentCompletePeriod(timeframe: ReportTimeframe, now = new Date()): ReportPeriod {
  if (timeframe === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return { start, end };
  }

  const currentMonday = startOfWeek(now);
  if (timeframe === "weekly") {
    const start = addDays(currentMonday, -7);
    return { start, end: endOfDay(addDays(start, 6)) };
  }

  const currentPairStart = getBiweeklyStart(currentMonday);
  const start = addDays(currentPairStart, -14);
  return { start, end: endOfDay(addDays(start, 13)) };
}

export function getPeriodContainingDate(timeframe: ReportTimeframe, date: Date): ReportPeriod {
  if (timeframe === "monthly") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    return { start, end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)) };
  }

  const start = timeframe === "weekly" ? startOfWeek(date) : getBiweeklyStart(startOfWeek(date));
  const days = timeframeDays[timeframe];
  return { start, end: endOfDay(addDays(start, days - 1)) };
}

export function getPreviousPeriod(period: ReportPeriod, timeframe: ReportTimeframe): ReportPeriod {
  if (timeframe === "monthly") {
    const start = new Date(period.start.getFullYear(), period.start.getMonth() - 1, 1);
    const end = endOfDay(new Date(period.start.getFullYear(), period.start.getMonth(), 0));
    return { start, end };
  }

  const days = timeframeDays[timeframe];
  const start = addDays(period.start, -days);
  return { start, end: endOfDay(addDays(start, days - 1)) };
}

export function formatPeriod(period: ReportPeriod) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${formatter.format(period.start)} – ${formatter.format(period.end)}`;
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildPeriodReport(
  vulnerabilities: Vulnerability[],
  entries: AuditEntry[],
  period: ReportPeriod
): PeriodReport {
  const vulnerabilityMap = new Map(vulnerabilities.map((vulnerability) => [vulnerability.id, vulnerability]));
  const cases = reportCaseHistory
    .map((history) => {
      const vulnerability = vulnerabilityMap.get(history.cve);
      if (!vulnerability) return null;
      return toReportCase(history, vulnerability, period.end);
    })
    .filter((item): item is ReportCase => Boolean(item));

  const visibleCases = cases.filter((item) => item.discoveredAt <= period.end);
  const activeCases = visibleCases.filter(
    (item) => !item.reviewedAt || item.reviewedAt > period.end
  );
  const openCriticalCases = activeCases
    .filter((item) => item.severity === "Critical")
    .sort((a, b) => b.score - a.score || a.dueAt.getTime() - b.dueAt.getTime());
  const reviewedCases = visibleCases
    .filter((item) => item.reviewedAt && isWithin(item.reviewedAt, period))
    .sort((a, b) => (b.reviewedAt?.getTime() ?? 0) - (a.reviewedAt?.getTime() ?? 0));
  const dueCases = visibleCases.filter((item) => isWithin(item.dueAt, period));
  const olaMet = dueCases.filter(
    (item) => item.reviewedAt && item.reviewedAt <= item.dueAt
  ).length;
  const missedOlaCases = dueCases.filter(
    (item) => !item.reviewedAt || item.reviewedAt > item.dueAt
  );
  const severityCounts = activeCases.reduce(
    (counts, item) => {
      counts[item.severity] += 1;
      return counts;
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 } as Record<SeverityBand, number>
  );
  const periodEntries = entries.filter((entry) => isWithin(new Date(entry.timestamp), period));
  const discoveredCases = visibleCases.filter((item) => isWithin(item.discoveredAt, period));
  const overrideEntries = periodEntries.filter((entry) => entry.decisionType === "Human Override");
  const dismissedEntries = periodEntries.filter((entry) => entry.status === "Dismissed");
  const activity = [...discoveredCases, ...reviewedCases]
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 6);

  return {
    openCritical: openCriticalCases.length,
    openCriticalCases,
    openCases: activeCases,
    reviewed: reviewedCases.length,
    reviewedCases,
    olaAdherence: dueCases.length ? Math.round((olaMet / dueCases.length) * 100) : 100,
    olaMet,
    olaTotal: dueCases.length,
    dueCases,
    missedOlaCases,
    severityCounts,
    maxSeverityCount: Math.max(...Object.values(severityCounts), 1),
    discovered: discoveredCases.length,
    discoveredCases,
    overrides: overrideEntries.length,
    overrideEntries,
    dismissed: dismissedEntries.length,
    dismissedEntries,
    activity
  };
}

export function buildReportInsights(current: PeriodReport, previous: PeriodReport): ReportInsight[] {
  const criticalDelta = current.openCritical - previous.openCritical;
  const currentIds = new Set(current.openCriticalCases.map((item) => item.id));
  const previousIds = new Set(previous.openCriticalCases.map((item) => item.id));
  const newlyOpen = current.openCriticalCases.filter((item) => !previousIds.has(item.id));
  const noLongerOpen = previous.openCriticalCases.filter((item) => !currentIds.has(item.id));
  const criticalDetail =
    criticalDelta === 0 && (newlyOpen.length || noLongerOpen.length)
      ? `The total was unchanged, but the mix shifted: ${joinCaseIds(newlyOpen)} entered the open Critical population while ${joinCaseIds(noLongerOpen)} left it.`
      : criticalDelta > 0
        ? `${pluralize(criticalDelta, "additional Critical case")} remained open at period end. ${newlyOpen.length ? `${joinCaseIds(newlyOpen)} drove the increase.` : ""}`
        : criticalDelta < 0
          ? `${pluralize(Math.abs(criticalDelta), "fewer Critical case")} remained open. ${noLongerOpen.length ? `${joinCaseIds(noLongerOpen)} left the open population.` : ""}`
          : "The open Critical population was stable with no case-level change.";

  const reviewDelta = current.reviewed - previous.reviewed;
  const reviewDetail =
    reviewDelta > 0
      ? `Completed reviews increased by ${reviewDelta}. ${joinCaseIds(current.reviewedCases.slice(0, 3))} were the main reviewed cases.`
      : reviewDelta < 0
        ? `Completed reviews decreased by ${Math.abs(reviewDelta)} because fewer cases reached reviewed status in this period.`
        : `Review volume was unchanged at ${current.reviewed}; ${joinCaseIds(current.reviewedCases.slice(0, 3)) || "no cases"} completed review in the period.`;

  const olaDelta = current.olaAdherence - previous.olaAdherence;
  const olaDetail =
    olaDelta > 0
      ? `Adherence improved by ${olaDelta} percentage points as ${current.olaMet} of ${current.olaTotal} due cases met their target.`
      : olaDelta < 0
        ? `Adherence declined by ${Math.abs(olaDelta)} percentage points; ${current.olaTotal - current.olaMet} of ${current.olaTotal} due cases missed their target${current.missedOlaCases.length ? `, including ${joinCaseIds(current.missedOlaCases)}` : ""}.`
        : `Adherence was unchanged at ${current.olaAdherence}%, with ${current.olaMet} of ${current.olaTotal} due cases meeting target.`;

  return [
    {
      title: "Critical exposure",
      detail: criticalDetail,
      tone: criticalDelta > 0 ? "negative" : criticalDelta < 0 ? "positive" : "neutral"
    },
    {
      title: "Review throughput",
      detail: reviewDetail,
      tone: reviewDelta > 0 ? "positive" : reviewDelta < 0 ? "negative" : "neutral"
    },
    {
      title: "OLA performance",
      detail: olaDetail,
      tone: olaDelta > 0 ? "positive" : olaDelta < 0 ? "negative" : "neutral"
    }
  ];
}

function toReportCase(history: ReportCaseHistory, vulnerability: Vulnerability, periodEnd: Date): ReportCase {
  const governance = getGovernanceDecision(vulnerability);
  const reviewedAt = history.reviewedAt ? new Date(history.reviewedAt) : null;
  const dueAt = new Date(history.dueAt);
  return {
    id: vulnerability.id,
    product: vulnerability.product,
    severity: governance.severityBand,
    score: governance.score,
    status: reviewedAt && reviewedAt <= periodEnd ? "Reviewed" : "Open",
    olaTarget: governance.olaTarget,
    internetFacing: vulnerability.internetFacing,
    threatActivity:
      vulnerability.threatActorActivity === "FINANCIAL_SECTOR_TARGETING"
        ? "Financial-sector targeting"
        : vulnerability.threatActorActivity === "ACTIVE_EXPLOITATION"
          ? "Active exploitation"
          : "No known activity",
    discoveredAt: new Date(history.discoveredAt),
    dueAt,
    reviewedAt,
    overdue: dueAt <= periodEnd && (!reviewedAt || reviewedAt > dueAt)
  };
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay();
  return addDays(result, -(day === 0 ? 6 : day - 1));
}

function getBiweeklyStart(monday: Date) {
  const anchorMonday = new Date(1969, 11, 29);
  const weeksSinceAnchor = Math.floor((calendarDayNumber(monday) - calendarDayNumber(anchorMonday)) / 7);
  return addDays(anchorMonday, Math.floor(weeksSinceAnchor / 2) * 14);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  const result = startOfDay(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isWithin(date: Date, period: ReportPeriod) {
  return date >= period.start && date <= period.end;
}

function joinCaseIds(cases: ReportCase[]) {
  return cases.map((item) => item.id).join(", ");
}

function pluralize(count: number, phrase: string) {
  return `${count} ${phrase}${count === 1 ? "" : "s"}`;
}

function calendarDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / (24 * 60 * 60 * 1000);
}
