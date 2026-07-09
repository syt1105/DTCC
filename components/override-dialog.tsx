"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecommendationBadge } from "@/components/ui/badge";
import type { Recommendation } from "@/lib/types";
import { getDefaultOverrideDecision } from "@/lib/vulnerabilities";

const reasons = [
  "False Positive",
  "Maintenance Window",
  "Compensating Control",
  "Business Exception",
  "Other"
];

const decisions: Recommendation[] = ["ACT", "ATTEND", "TRACK"];

export function OverrideDialog({
  open,
  recommendation,
  onClose,
  onSubmit
}: {
  open: boolean;
  recommendation: Recommendation;
  onClose: () => void;
  onSubmit: (payload: { finalDecision: Recommendation; reason: string; comments: string }) => void;
}) {
  const [reason, setReason] = useState(reasons[1]);
  const [comments, setComments] = useState("");
  const [finalDecision, setFinalDecision] = useState<Recommendation>(getDefaultOverrideDecision(recommendation));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-navy/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[12px] border border-border bg-white p-6 shadow-enterprise dark:bg-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy dark:text-white">Override Recommendation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You are overriding the AI recommendation. A reason is required for auditability.
            </p>
          </div>
          <Button aria-label="Close override dialog" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-navy dark:text-white">AI Recommendation</label>
            <div className="mt-2">
              <RecommendationBadge value={recommendation} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-navy dark:text-white" htmlFor="final-decision">
              Final Decision
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {decisions.map((decision) => (
                <button
                  className={`focus-ring rounded-full border px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                    finalDecision === decision
                      ? "border-greenAccent bg-greenLight/70 text-starbucks"
                      : "border-border bg-white text-slate-600 hover:bg-greenLight/35 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                  key={decision}
                  type="button"
                  onClick={() => setFinalDecision(decision)}
                >
                  {decision}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-navy dark:text-white" htmlFor="override-reason">
              Override Reason
            </label>
            <select
              className="focus-ring mt-2 h-10 w-full rounded-full border border-input bg-white px-4 text-sm text-navy dark:bg-slate-900 dark:text-white"
              id="override-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {reasons.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-navy dark:text-white" htmlFor="override-comments">
                Additional Comments
              </label>
              <span className="text-xs text-muted-foreground">{comments.length}/300</span>
            </div>
            <textarea
              className="focus-ring mt-2 h-32 w-full resize-none rounded-[12px] border border-input bg-white px-3 py-2 text-sm text-navy placeholder:text-muted-foreground dark:bg-slate-900 dark:text-white"
              id="override-comments"
              maxLength={300}
              placeholder="Document the control, exception, or timing context."
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                finalDecision,
                reason,
                comments
              })
            }
          >
            Submit Override
          </Button>
        </div>
      </div>
    </div>
  );
}
