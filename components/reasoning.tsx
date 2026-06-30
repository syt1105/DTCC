import { CheckCircle2 } from "lucide-react";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DecisionPathStep, ReasoningOutput, Recommendation, Vulnerability } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SsvcReviewPanel({
  reasoning,
  vulnerability
}: {
  reasoning: ReasoningOutput;
  vulnerability: Vulnerability;
}) {
  const decision = reasoning.decisionPath[reasoning.decisionPath.length - 1];
  const factors = reasoning.decisionPath.slice(0, -1);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>AI-Assisted SSVC Review</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              One consolidated view of recommendation, decision path, and evidence inputs.
            </p>
          </div>
          <ConfidenceBadge value={reasoning.confidence} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border bg-slate-50 p-4 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">Recommendation Rationale</div>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-navy dark:text-white">
                {decision.rationale}
              </p>
            </div>
            <div className="shrink-0">
              <RecommendationBadge className="min-w-20 justify-center" value={reasoning.recommendation} />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-navy dark:text-white">Decision Path</h3>
            <span className="text-xs text-muted-foreground">SSVC-inspired PoC logic</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reasoning.decisionPath.map((step, index) => (
              <PathStep index={index} key={`${step.label}-${step.value}`} step={step} />
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-bold text-navy dark:text-white">Evidence Inputs</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {reasoning.evidence.map((item) => (
                <Badge className="min-h-5 px-1.5 text-[11px]" key={item} tone="blue">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-bold text-navy dark:text-white">Snapshot</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <SnapshotItem label="CISA KEV" value={vulnerability.kev ? "Listed" : "Not listed"} />
              <SnapshotItem label="EPSS" value={vulnerability.epss.toFixed(5)} />
              <SnapshotItem label="CVSS" value={vulnerability.cvss.toFixed(1)} />
              <SnapshotItem label="Asset Context" value={`${vulnerability.tier}, ${vulnerability.internetFacing ? "External" : "Internal"}`} />
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          This is an SSVC-inspired PoC flow, not a complete implementation of the official CISA SSVC model.
        </p>
      </CardContent>
    </Card>
  );
}

export function ConfidenceRing({ value }: { value: number }) {
  const color = value >= 90 ? "#2563EB" : value >= 75 ? "#F97316" : "#16A34A";

  return (
    <div
      className="grid h-16 w-16 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${value * 3.6}deg, #E5E7EB 0deg)`
      }}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-bold text-navy dark:bg-card dark:text-white">
        {value}%
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  return (
    <div className="flex min-h-20 min-w-28 flex-col items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-center">
      <div className="text-xs font-bold uppercase text-blue-700">Confidence</div>
      <div className="text-lg font-bold text-navy">{value}%</div>
    </div>
  );
}

function PathStep({
  step,
  index
}: {
  step: DecisionPathStep;
  index: number;
}) {
  return (
    <div
      className={cn(
        "h-full rounded-lg border p-3",
        step.tone === "ACT" && "border-red-100 bg-red-50",
        step.tone === "ATTEND" && "border-orange-100 bg-orange-50",
        step.tone === "TRACK" && "border-green-100 bg-green-50",
        step.tone === "neutral" && "border-slate-200 bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase text-slate-500">{step.label}</div>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-navy shadow-sm">
          {index + 1}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-base font-bold text-navy">{step.value}</div>
        {step.label === "SSVC Decision" ? <RecommendationBadge value={step.value as Recommendation} /> : null}
      </div>
      <div className="mt-2 truncate text-xs font-semibold text-slate-500" title={step.source}>
        {step.source}
      </div>
    </div>
  );
}

function SnapshotItem({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
      <div className="text-[11px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-bold text-navy dark:text-white">{value}</div>
    </div>
  );
}
