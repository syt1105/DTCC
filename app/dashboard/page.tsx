import Link from "next/link";
import type React from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, Clock3, FileCheck2, ShieldAlert, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { ConfidenceRing } from "@/components/reasoning";
import {
  deriveRecommendation,
  getGovernanceDecision,
  getSummaryCounts,
  sortByRecommendationPriority,
  vulnerabilities
} from "@/lib/vulnerabilities";
import type { Recommendation } from "@/lib/types";

export default function DashboardPage() {
  const summary = getSummaryCounts();
  const priority = [...vulnerabilities].sort(sortByRecommendationPriority).slice(0, 5);
  const total = vulnerabilities.length;
  const avgConfidence = Math.round(
    vulnerabilities.reduce((sum, vulnerability) => sum + vulnerability.confidence, 0) / total
  );
  const kevCount = vulnerabilities.filter((vulnerability) => vulnerability.kev).length;
  const accelerated = vulnerabilities.filter((vulnerability) => getGovernanceDecision(vulnerability).acceleratedRemediation).length;
  const avgSeverity = Math.round(
    vulnerabilities.reduce((sum, vulnerability) => sum + getGovernanceDecision(vulnerability).score, 0) / total
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-white">TVA Review Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Executive view of internal severity, OLA-driven remediation, and analyst decisions.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-greenAccent bg-greenAccent px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-starbucks active:scale-95"
            href="/"
          >
            Open CVE Queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={ShieldAlert} label="Total Enriched CVEs" value={total} />
          <Metric icon={TrendingUp} label="KEV Listed" tone="red" value={kevCount} />
          <Metric icon={Clock3} label="Avg Internal Severity" tone="orange" value={avgSeverity} />
          <Metric icon={FileCheck2} label="Accelerated Required" tone="red" value={accelerated} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
          <Card>
            <CardHeader>
              <CardTitle>Remediation Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Current queue mix by OLA-driven decision.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["ACT", "ATTEND", "TRACK"] as Recommendation[]).map((item) => (
                <div key={item}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <RecommendationBadge value={item} />
                    <span className="font-bold text-navy dark:text-white">{summary[item]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${
                        item === "ACT" ? "bg-act" : item === "ATTEND" ? "bg-attend" : "bg-track"
                      }`}
                      style={{ width: `${(summary[item] / total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Highest Priority Reviews</CardTitle>
              <p className="text-sm text-muted-foreground">Top vulnerabilities analysts should review first.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priority.map((vulnerability) => (
                  <Link
                    className="flex items-center justify-between gap-4 rounded-[12px] border border-border px-4 py-3 transition-colors hover:bg-greenLight/25 dark:hover:bg-slate-800"
                    href={`/cves/${vulnerability.id}`}
                    key={vulnerability.id}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-starbucks">{vulnerability.id}</div>
                      <div className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{vulnerability.product}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={vulnerability.kev ? "red" : "slate"}>{vulnerability.kev ? "KEV" : "No KEV"}</Badge>
                      <Badge tone={getGovernanceDecision(vulnerability).acceleratedRemediation ? "red" : "blue"}>
                        {getGovernanceDecision(vulnerability).olaTarget}
                      </Badge>
                      <RecommendationBadge value={deriveRecommendation(vulnerability)} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>AI Review Workflow</CardTitle>
              <p className="text-sm text-muted-foreground">The prototype keeps analysts in control while reducing correlation work.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                {["Correlate Evidence", "Score Internal Severity", "Assign OLA", "Record Decision"].map((step, index) => (
                  <div className="rounded-[12px] border border-border bg-ceramic/60 p-4 dark:bg-slate-900" key={step}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-greenLight/70 text-starbucks">
                      {index === 0 ? <BrainCircuit className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div className="mt-3 text-sm font-bold text-navy dark:text-white">{step}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Confidence</CardTitle>
              <p className="text-sm text-muted-foreground">Average confidence across enriched CVEs.</p>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <ConfidenceRing value={avgConfidence} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "blue"
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "blue" | "red" | "orange" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "bg-red-50 text-act"
      : tone === "orange"
        ? "bg-orange-50 text-attend"
        : tone === "green"
          ? "bg-green-50 text-track"
          : "bg-greenLight/60 text-starbucks";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-navy dark:text-white">{value}</div>
          <div className="mt-1 text-sm font-semibold text-muted-foreground">{label}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
