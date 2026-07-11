"use client";

import {
  CalendarDays,
  ClipboardPaste,
  Filter,
  RefreshCcw,
  Search,
  Upload,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AppShell } from "@/components/shell";
import { EmptyState, SummaryCard, VulnerabilityTable, summaryConfig } from "@/components/dashboard-widgets";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/toast";
import type { Recommendation, Vulnerability } from "@/lib/types";
import {
  batchLookupCatalog,
  deriveRecommendation,
  getGovernanceDecision,
  lookupVulnerabilities,
  sortByRecommendationPriority,
  threatActorActivityLabel,
  vulnerabilities
} from "@/lib/vulnerabilities";
import { readDismissedIds, readImportedIds, writeDismissedIds, writeImportedIds } from "@/lib/queue-state";
import { writeAuditEntry } from "@/lib/audit";

const filterOptions: Array<Recommendation | "ALL"> = ["ALL", "ACT", "ATTEND", "TRACK"];
const tuesdayReleaseIds = batchLookupCatalog.map((vulnerability) => vulnerability.id);
const dismissReasons = [
  "Component not deployed in environment",
  "Version not affected",
  "Compensating control in place",
  "Business exception approved",
  "Duplicate finding",
  "Other"
];

type QueueView = "ACTIVE" | "DISMISSED";

export default function QueuePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Recommendation | "ALL">("ALL");
  const [queueView, setQueueView] = useState<QueueView>("ACTIVE");
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [dismissTarget, setDismissTarget] = useState<Vulnerability | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const load = () => {
      setImportedIds(readImportedIds());
      setDismissedIds(readDismissedIds());
    };

    load();
    window.addEventListener("tva-queue-updated", load);
    return () => window.removeEventListener("tva-queue-updated", load);
  }, []);

  const queue = useMemo(() => {
    const baseIds = new Set(vulnerabilities.map((vulnerability) => vulnerability.id));
    const imported = batchLookupCatalog.filter(
      (vulnerability) => importedIds.includes(vulnerability.id) && !baseIds.has(vulnerability.id)
    );
    return [...vulnerabilities, ...imported];
  }, [importedIds]);

  const visibleQueue = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return queue
      .filter((vulnerability) => {
        const dismissed = dismissedIds.includes(vulnerability.id);
        const matchesView = queueView === "DISMISSED" ? dismissed : !dismissed;
        const matchesSearch =
          !normalized ||
          vulnerability.id.toLowerCase().includes(normalized) ||
          vulnerability.product.toLowerCase().includes(normalized) ||
          vulnerability.businessUnit.toLowerCase().includes(normalized) ||
          threatActorActivityLabel(vulnerability.threatActorActivity).toLowerCase().includes(normalized);
        const matchesFilter = filter === "ALL" || deriveRecommendation(vulnerability) === filter;
        return matchesView && matchesSearch && matchesFilter;
      })
      .sort(sortByRecommendationPriority);
  }, [dismissedIds, filter, query, queue, queueView]);

  const activeQueue = useMemo(
    () => queue.filter((vulnerability) => !dismissedIds.includes(vulnerability.id)),
    [dismissedIds, queue]
  );
  const summary = useMemo(() => getCounts(activeQueue), [activeQueue]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function addImported(ids: string[]) {
    const knownIds = new Set([...vulnerabilities, ...batchLookupCatalog].map((vulnerability) => vulnerability.id));
    const nextImported = writeImportedIds([...importedIds, ...ids.filter((id) => knownIds.has(id))]);
    const nextDismissed = writeDismissedIds(dismissedIds.filter((id) => !ids.includes(id)));
    setImportedIds(nextImported);
    setDismissedIds(nextDismissed);
  }

  function autoImportTuesdayRelease() {
    const before = new Set([...vulnerabilities.map((vulnerability) => vulnerability.id), ...importedIds]);
    const newIds = tuesdayReleaseIds.filter((id) => !before.has(id) || dismissedIds.includes(id));
    addImported(tuesdayReleaseIds);
    showToast(
      newIds.length > 0
        ? `Tuesday release imported: ${newIds.length} CVEs added or reinstated.`
        : "Tuesday release is already present in the queue."
    );
  }

  function openDismiss(vulnerability: Vulnerability) {
    setDismissTarget(vulnerability);
  }

  function dismissVulnerability(vulnerability: Vulnerability, reason: string, comments: string) {
    const governance = getGovernanceDecision(vulnerability);
    const recommendation = deriveRecommendation(vulnerability);
    const nextDismissed = writeDismissedIds([...dismissedIds, vulnerability.id]);
    setDismissedIds(nextDismissed);
    setDismissTarget(null);

    try {
      writeAuditEntry({
        cve: vulnerability.id,
        recommendation,
        finalDecision: recommendation,
        override: true,
        reason,
        status: "Dismissed",
        comments,
        decisionType: "Dismissed as Not Applicable",
        dtccSeverityScore: governance.score,
        dtccSeverityBand: governance.severityBand,
        olaTarget: governance.olaTarget,
        acceleratedRemediation: governance.acceleratedRemediation
      });
    } catch {
      // The queue state still changes; the toast tells the analyst audit persistence failed.
      showToast("Dismissed locally, but audit storage could not be updated.");
      return;
    }

    showToast(`${vulnerability.id} dismissed as not applicable.`);
  }

  function reinstate(vulnerability: Vulnerability) {
    const nextDismissed = writeDismissedIds(dismissedIds.filter((id) => id !== vulnerability.id));
    setDismissedIds(nextDismissed);
    showToast(`${vulnerability.id} reinstated to the active queue.`);
  }

  return (
    <AppShell>
      <Toast message={toast} visible={Boolean(toast)} />
      <BatchLookupDialog
        dismissedIds={dismissedIds}
        open={batchOpen}
        queueIds={queue.map((vulnerability) => vulnerability.id)}
        onClose={() => setBatchOpen(false)}
        onImport={(ids) => {
          addImported(ids);
          setBatchOpen(false);
          showToast(`${ids.length} CVEs enriched and added to the queue.`);
        }}
      />
      <DismissDialog
        vulnerability={dismissTarget}
        onClose={() => setDismissTarget(null)}
        onDismiss={dismissVulnerability}
      />

      <div className="space-y-6">
        <PageHeader
          description="AI-prioritized vulnerabilities based on SSVC decision logic and enterprise asset context."
          eyebrow="Threat & Vulnerability Assessment"
          title="CVE Queue Overview"
          actions={
            <>
            <Button variant="outline" onClick={() => setBatchOpen(true)}>
              <ClipboardPaste className="h-4 w-4" />
              Batch Lookup
            </Button>
            <Button onClick={autoImportTuesdayRelease}>
              <CalendarDays className="h-4 w-4" />
              Auto Import Tuesday
            </Button>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(summaryConfig) as Recommendation[]).map((key) => {
            const config = summaryConfig[key];
            return (
              <SummaryCard
                count={summary[key]}
                description={config.description}
                icon={config.icon}
                key={key}
                label={key}
              />
            );
          })}
        </div>

        <Card className="p-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-center">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-[12px] pl-10"
                placeholder="Search CVE, product, business unit, or threat activity..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  className={filter === option ? "border-greenAccent bg-greenAccent text-white hover:bg-starbucks" : ""}
                  key={option}
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter(option)}
                >
                  {option === "ALL" ? <Filter className="h-4 w-4" /> : null}
                  {option}
                </Button>
              ))}
            </div>
            <div className="flex rounded-full border border-border bg-white p-1">
              {(["ACTIVE", "DISMISSED"] as QueueView[]).map((view) => (
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    queueView === view ? "bg-greenAccent text-white" : "text-muted-foreground hover:bg-greenLight/40"
                  }`}
                  key={view}
                  type="button"
                  onClick={() => setQueueView(view)}
                >
                  {view === "ACTIVE" ? "Active Queue" : `Dismissed (${dismissedIds.length})`}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {visibleQueue.length > 0 ? (
          <VulnerabilityTable
            dismissedIds={dismissedIds}
            vulnerabilities={visibleQueue}
            onDismiss={openDismiss}
            onReinstate={reinstate}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </AppShell>
  );
}

function BatchLookupDialog({
  dismissedIds,
  open,
  queueIds,
  onClose,
  onImport
}: {
  dismissedIds: string[];
  open: boolean;
  queueIds: string[];
  onClose: () => void;
  onImport: (ids: string[]) => void;
}) {
  const [value, setValue] = useState("CVE-2024-28995, CVE-2024-40766\nCVE-2025-0108\nCVE-2024-9999");

  useEffect(() => {
    if (open) setValue("CVE-2024-28995, CVE-2024-40766\nCVE-2025-0108\nCVE-2024-9999");
  }, [open]);

  const ids = useMemo(() => parseCveIds(value), [value]);
  const results = useMemo(() => lookupVulnerabilities(ids), [ids]);
  const matched = results.filter((result) => result.vulnerability);
  const importable = matched
    .map((result) => result.vulnerability?.id)
    .filter((id): id is string => Boolean(id))
    .filter((id) => !queueIds.includes(id) || dismissedIds.includes(id));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-navy/60 px-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[12px] border border-border bg-white shadow-enterprise"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-navy">Batch Vulnerability Lookup</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Paste CVE identifiers or use the Tuesday release shortcut. The PoC enriches matches from the local mock
              catalog before adding them to the review queue.
            </p>
          </div>
          <Button aria-label="Close batch lookup" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-bold text-navy" htmlFor="batch-cves">
              CVE identifiers
            </label>
            <Button size="sm" variant="outline" onClick={() => setValue(tuesdayReleaseIds.join("\n"))}>
              <RefreshCcw className="h-4 w-4" />
              Use Tuesday Release
            </Button>
          </div>
          <textarea
            className="focus-ring mt-2 min-h-32 w-full resize-y rounded-[12px] border border-input bg-white px-4 py-3 text-sm text-navy placeholder:text-muted-foreground"
            id="batch-cves"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Separated by commas, spaces, or new lines</span>
            <span className="font-bold text-starbucks">
              {ids.length} recognized · {matched.length} matched · {ids.length - matched.length} not found
            </span>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold text-navy">Preview</div>
            <div className="mt-3 space-y-2">
              {results.map((result) =>
                result.vulnerability ? (
                  <LookupRow
                    alreadyQueued={queueIds.includes(result.vulnerability.id)}
                    key={result.id}
                    vulnerability={result.vulnerability}
                  />
                ) : (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-dashed border-border bg-ceramic/60 px-4 py-3"
                    key={result.id}
                  >
                    <div>
                      <div className="font-bold text-stone-500">{result.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Not found in the local CVE / CISA KEV / FIRST EPSS PoC catalog.
                      </div>
                    </div>
                    <Badge tone="slate">No match</Badge>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={importable.length === 0} onClick={() => onImport(importable)}>
            <Upload className="h-4 w-4" />
            Enrich & add {importable.length} to queue
          </Button>
        </div>
      </div>
    </div>
  );
}

function LookupRow({
  alreadyQueued,
  vulnerability
}: {
  alreadyQueued: boolean;
  vulnerability: Vulnerability;
}) {
  const governance = getGovernanceDecision(vulnerability);
  const recommendation = deriveRecommendation(vulnerability);

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-bold text-starbucks">{vulnerability.id}</div>
        <div className="mt-1 text-sm text-muted-foreground">{vulnerability.product}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {alreadyQueued ? <Badge tone="blue">Already queued</Badge> : null}
        <Badge tone={governance.severityBand === "Critical" ? "red" : governance.severityBand === "High" ? "orange" : "blue"}>
          {governance.score} · {governance.severityBand}
        </Badge>
        <RecommendationBadge value={recommendation} />
      </div>
    </div>
  );
}

function DismissDialog({
  vulnerability,
  onClose,
  onDismiss
}: {
  vulnerability: Vulnerability | null;
  onClose: () => void;
  onDismiss: (vulnerability: Vulnerability, reason: string, comments: string) => void;
}) {
  const [reason, setReason] = useState(dismissReasons[0]);
  const [comments, setComments] = useState(
    "Affected component is not deployed in the reviewed environment; no reachable asset is in scope."
  );

  useEffect(() => {
    if (vulnerability) {
      setReason(dismissReasons[0]);
      setComments("Affected component is not deployed in the reviewed environment; no reachable asset is in scope.");
    }
  }, [vulnerability]);

  if (!vulnerability) return null;

  const governance = getGovernanceDecision(vulnerability);
  const recommendation = deriveRecommendation(vulnerability);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-navy/60 px-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-full max-w-xl rounded-[12px] border border-border bg-white shadow-enterprise"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-navy">Dismiss as Not Applicable</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Remove this CVE from the active queue. The rationale is recorded in the audit trail.
            </p>
          </div>
          <Button aria-label="Close dismiss dialog" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-border bg-ceramic/60 p-3">
            <span className="font-bold text-starbucks">{vulnerability.id}</span>
            <span className="text-sm text-muted-foreground">{vulnerability.product}</span>
            <Badge tone={governance.severityBand === "Critical" ? "red" : governance.severityBand === "High" ? "orange" : "blue"}>
              {governance.score} · {governance.severityBand}
            </Badge>
            <RecommendationBadge value={recommendation} />
          </div>

          <div>
            <label className="text-sm font-bold text-navy" htmlFor="dismiss-reason">
              Reason
            </label>
            <select
              className="focus-ring mt-2 h-11 w-full rounded-full border border-input bg-white px-4 text-sm font-semibold text-navy"
              id="dismiss-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {dismissReasons.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-navy" htmlFor="dismiss-comments">
              Justification
            </label>
            <textarea
              className="focus-ring mt-2 min-h-24 w-full resize-y rounded-[12px] border border-input bg-white px-4 py-3 text-sm text-navy"
              id="dismiss-comments"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
          </div>

          <div className="rounded-[12px] border border-[#B9DED2] bg-greenLight/45 px-4 py-3 text-sm font-medium text-navy">
            Dismissed items stay searchable under the Dismissed filter and can be reinstated to the queue.
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onDismiss(vulnerability, reason, comments)}>
            Dismiss CVE
          </Button>
        </div>
      </div>
    </div>
  );
}

function parseCveIds(value: string) {
  return Array.from(new Set(value.toUpperCase().match(/CVE-\d{4}-\d{4,7}/g) ?? []));
}

function getCounts(items: Vulnerability[]) {
  return items.reduce(
    (summary, vulnerability) => {
      summary[deriveRecommendation(vulnerability)] += 1;
      return summary;
    },
    { ACT: 0, ATTEND: 0, TRACK: 0 } as Record<Recommendation, number>
  );
}
