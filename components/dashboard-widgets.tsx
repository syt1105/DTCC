"use client";

import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, Clock3, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import type { Recommendation, Vulnerability } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  deriveRecommendation,
  getGovernanceDecision,
  threatActorActivityLabel
} from "@/lib/vulnerabilities";

export function SummaryCard({
  label,
  count,
  description,
  icon: Icon
}: {
  label: Recommendation;
  count: number;
  description: string;
  icon: React.ElementType;
}) {
  const tone =
    label === "ACT"
      ? "text-act bg-red-50"
      : label === "ATTEND"
        ? "text-attend bg-orange-50"
        : "text-track bg-green-50";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className={cn("text-3xl font-bold", tone.split(" ")[0])}>{count}</div>
          <div className="mt-2 text-sm font-bold text-navy dark:text-white">{label}</div>
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export const summaryConfig = {
  ACT: { description: "Accelerated remediation", icon: ShieldCheck },
  ATTEND: { description: "OLA scheduled review", icon: Clock3 },
  TRACK: { description: "Standard monitoring", icon: Activity }
} as const;

export function RiskCard({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "red" | "orange" | "green" | "blue" | "slate";
}) {
  return (
    <Card className="p-4">
      <div className="text-2xl font-bold text-navy dark:text-white">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <Badge className="mt-3" tone={tone ?? "slate"}>
        {detail}
      </Badge>
    </Card>
  );
}

export function VulnerabilityTable({
  dismissedIds = [],
  onDismiss,
  onReinstate,
  vulnerabilities
}: {
  dismissedIds?: string[];
  onDismiss?: (vulnerability: Vulnerability) => void;
  onReinstate?: (vulnerability: Vulnerability) => void;
  vulnerabilities: Vulnerability[];
}) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-enterprise dark:bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] table-fixed text-center">
          <thead>
            <tr className="border-b border-border bg-greenLight/20 text-xs font-bold text-slate-600">
              <th className="w-[13.5%] px-3 py-5 text-center">CVE</th>
              <th className="w-[19.5%] px-3 py-5 text-center">Product</th>
              <th className="w-[11%] px-3 py-5 text-center">DTCC Severity</th>
              <th className="w-[5.5%] px-2 py-5 text-center">OLA</th>
              <th className="w-[18.5%] px-3 py-5 text-center">Threat Activity</th>
              <th className="w-[9%] px-3 py-5 text-center">Exposure</th>
              <th className="w-[8%] px-3 py-5 text-center">Decision</th>
              <th className="w-[15%] px-3 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vulnerabilities.map((vulnerability) => {
              const governance = getGovernanceDecision(vulnerability);
              const recommendation = deriveRecommendation(vulnerability);
              const dismissed = dismissedIds.includes(vulnerability.id);

              return (
                <tr
                  className={cn(
                    "group cursor-pointer border-b border-border bg-white text-sm transition-colors last:border-b-0 hover:bg-greenLight/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-900/35 dark:hover:bg-slate-800/70",
                    dismissed && "opacity-70"
                  )}
                  key={vulnerability.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/cves/${vulnerability.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/cves/${vulnerability.id}`);
                    }
                  }}
                >
                  <td className="px-3 py-4 text-center font-bold text-starbucks">
                    <span className="whitespace-nowrap">{vulnerability.id}</span>
                  </td>
                  <td className="px-3 py-4 text-center font-medium text-navy dark:text-white">
                    <div className="mx-auto max-w-[190px] truncate" title={vulnerability.product}>
                      {vulnerability.product}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="font-bold text-navy dark:text-white">{governance.score}</div>
                      <Badge className="mt-1 justify-center" tone={severityTone(governance.severityBand)}>
                        {governance.severityBand}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-center font-semibold">{formatOlaTarget(governance.olaTarget)}</td>
                  <td className="px-3 py-4 text-center">
                    <Badge className="justify-center whitespace-nowrap leading-4" tone={vulnerability.threatActorActivity === "FINANCIAL_SECTOR_TARGETING" ? "red" : vulnerability.threatActorActivity === "ACTIVE_EXPLOITATION" ? "orange" : "slate"}>
                      {threatActorActivityLabel(vulnerability.threatActorActivity)}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <Badge tone={vulnerability.internetFacing ? "orange" : "blue"}>
                      {vulnerability.internetFacing ? "External" : "Internal"}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <RecommendationBadge value={recommendation} />
                  </td>
                  <td className="px-3 py-4 text-center text-starbucks">
                    <div className="flex items-center justify-center">
                      {dismissed ? (
                        <button
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#B9DED2] bg-greenLight/50 px-2 text-xs font-bold text-starbucks hover:bg-greenLight"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onReinstate?.(vulnerability);
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reinstate
                        </button>
                      ) : (
                        <button
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 text-xs font-bold text-attend hover:bg-orange-100"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDismiss?.(vulnerability);
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Dismiss
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function severityTone(severity: string) {
  if (severity === "Critical") return "red";
  if (severity === "High") return "orange";
  if (severity === "Medium") return "blue";
  return "green";
}

function formatOlaTarget(target: string) {
  if (target === "24 hours") return "24h";
  if (target === "7 days") return "7d";
  if (target === "30 days") return "30d";
  return target;
}

export function EmptyState() {
  return (
    <div className="rounded-[12px] border border-dashed border-border bg-white p-10 text-center shadow-enterprise dark:bg-card">
      <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
      <div className="mt-3 text-sm font-semibold text-navy dark:text-white">No vulnerabilities match this view.</div>
      <div className="mt-1 text-sm text-muted-foreground">Try clearing search or changing the SSVC filter.</div>
    </div>
  );
}
