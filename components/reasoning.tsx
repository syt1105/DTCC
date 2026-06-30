import { CheckCircle2, Database, Globe2, Layers3, ShieldAlert, Target, TriangleAlert } from "lucide-react";
import { Badge, RecommendationBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DecisionPathStep, ReasoningOutput, Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons = [ShieldAlert, Globe2, TriangleAlert, Target, Database];

export function ReasoningPanel({ reasoning }: { reasoning: ReasoningOutput }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Reasoning</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          {reasoning.evidence.map((item) => (
            <Badge key={item} tone="blue">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {item}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reasoning.log.map((line, index) => {
            const Icon = icons[index % icons.length];
            return (
              <div className="flex gap-3 text-sm" key={line}>
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="leading-6 text-slate-700 dark:text-slate-200">{line}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <div>
            <div className="text-sm font-semibold text-navy dark:text-white">Confidence Score</div>
            <div className="mt-1 text-xs text-muted-foreground">Based on correlated evidence and asset context</div>
          </div>
          <ConfidenceRing value={reasoning.confidence} />
        </div>
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

export function DecisionPath({ steps }: { steps: DecisionPathStep[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SSVC Decision Path</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
          {steps.map((step, index) => (
            <PathFragment key={`${step.label}-${step.value}`} showArrow={index < steps.length - 1} step={step} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PathFragment({
  step,
  showArrow
}: {
  step: DecisionPathStep;
  showArrow: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "rounded-lg border p-4 text-center",
          step.tone === "ACT" && "border-red-100 bg-red-50",
          step.tone === "ATTEND" && "border-orange-100 bg-orange-50",
          step.tone === "TRACK" && "border-green-100 bg-green-50",
          step.tone === "neutral" && "border-slate-200 bg-slate-50"
        )}
      >
        <div className="text-xs font-bold uppercase text-slate-500">{step.label}</div>
        <div className="mt-2 text-sm font-bold text-navy">{step.value}</div>
        {step.label === "SSVC Decision" ? <RecommendationBadge className="mt-3" value={step.value as Recommendation} /> : null}
      </div>
      {showArrow ? <div className="hidden text-center text-slate-400 md:block">→</div> : null}
    </>
  );
}
