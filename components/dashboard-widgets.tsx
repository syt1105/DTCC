"use client";

import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, Clock3, ShieldCheck, TrendingUp } from "lucide-react";
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
  vulnerabilities
}: {
  vulnerabilities: Vulnerability[];
}) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-enterprise dark:bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-separate border-spacing-y-2 px-3 py-2 text-left">
          <thead>
            <tr className="text-xs font-semibold text-slate-500">
              <th className="px-3 py-3">CVE</th>
              <th className="px-3 py-3">Product / Component</th>
              <th className="px-3 py-3">DTCC Severity</th>
              <th className="px-3 py-3">OLA</th>
              <th className="px-3 py-3">Threat Activity</th>
              <th className="px-3 py-3">Exposure</th>
              <th className="px-3 py-3">Decision</th>
              <th className="px-3 py-3 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {vulnerabilities.map((vulnerability) => {
              const governance = getGovernanceDecision(vulnerability);
              const recommendation = deriveRecommendation(vulnerability);

              return (
                <tr
                  className="group cursor-pointer rounded-[12px] bg-white text-sm shadow-row transition-colors hover:bg-greenLight/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-900/35 dark:hover:bg-slate-800/70"
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
                  <td className="rounded-l-lg border-l-4 border-l-greenAccent px-3 py-3 font-bold text-starbucks">
                    {vulnerability.id}
                  </td>
                  <td className="px-3 py-3 font-medium text-navy dark:text-white">{vulnerability.product}</td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-navy dark:text-white">{governance.score}</div>
                    <Badge className="mt-1" tone={severityTone(governance.severityBand)}>
                      {governance.severityBand}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 font-semibold">{governance.olaTarget}</td>
                  <td className="px-3 py-3">
                    <Badge tone={vulnerability.threatActorActivity === "FINANCIAL_SECTOR_TARGETING" ? "red" : vulnerability.threatActorActivity === "ACTIVE_EXPLOITATION" ? "orange" : "slate"}>
                      {threatActorActivityLabel(vulnerability.threatActorActivity)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={vulnerability.internetFacing ? "orange" : "blue"}>
                      {vulnerability.internetFacing ? "External" : "Internal"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <RecommendationBadge value={recommendation} />
                  </td>
                  <td className="rounded-r-lg px-3 py-3 text-right text-starbucks">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-greenLight">
                      <TrendingUp className="h-4 w-4 rotate-45" />
                    </span>
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

export function EmptyState() {
  return (
    <div className="rounded-[12px] border border-dashed border-border bg-white p-10 text-center shadow-enterprise dark:bg-card">
      <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
      <div className="mt-3 text-sm font-semibold text-navy dark:text-white">No vulnerabilities match this view.</div>
      <div className="mt-1 text-sm text-muted-foreground">Try clearing search or changing the SSVC filter.</div>
    </div>
  );
}
