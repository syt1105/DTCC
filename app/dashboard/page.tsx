import Link from "next/link";
import type React from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, Clock3, FileCheck2, ShieldAlert, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { ConfidenceRing } from "@/components/reasoning";
import { getSummaryCounts, sortByRecommendationPriority, vulnerabilities } from "@/lib/vulnerabilities";
import type { Recommendation } from "@/lib/types";

export default function DashboardPage() {
  const summary = getSummaryCounts();
  const priority = [...vulnerabilities].sort(sortByRecommendationPriority).slice(0, 5);
  const total = vulnerabilities.length;
  const avgConfidence = Math.round(
    vulnerabilities.reduce((sum, vulnerability) => sum + vulnerability.confidence, 0) / total
  );
  const kevCount = vulnerabilities.filter((vulnerability) => vulnerability.kev).length;
  const internetFacing = vulnerabilities.filter((vulnerability) => vulnerability.internetFacing).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-white">TVA Review Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Executive view of AI-assisted prioritization, analyst throughput, and SSVC decision distribution.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-blue-700"
            href="/"
          >
            Open CVE Queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={ShieldAlert} label="Total Enriched CVEs" value={total} />
          <Metric icon={TrendingUp} label="KEV Listed" tone="red" value={kevCount} />
          <Metric icon={Clock3} label="Internet Facing" tone="orange" value={internetFacing} />
          <Metric icon={FileCheck2} label="Audit Coverage" tone="green" value="100%" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
          <Card>
            <CardHeader>
              <CardTitle>SSVC Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Current queue mix by AI recommendation.</p>
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
                    className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    href={`/cves/${vulnerability.id}`}
                    key={vulnerability.id}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-blue-700">{vulnerability.id}</div>
                      <div className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{vulnerability.product}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={vulnerability.kev ? "red" : "slate"}>{vulnerability.kev ? "KEV" : "No KEV"}</Badge>
                      <RecommendationBadge value={vulnerability.recommendation} />
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
                {["Correlate Evidence", "Apply SSVC Logic", "Explain Recommendation", "Record Decision"].map((step, index) => (
                  <div className="rounded-lg border border-border bg-slate-50 p-4 dark:bg-slate-900" key={step}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700">
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
          : "bg-blue-50 text-blue-700";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-navy dark:text-white">{value}</div>
          <div className="mt-1 text-sm font-semibold text-muted-foreground">{label}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
