import * as React from "react";
import type { Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { recommendationTone } from "@/lib/vulnerabilities";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "blue" | "red" | "orange" | "green" | "slate";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tone === "default" && "border-border bg-ceramic text-navy",
        tone === "blue" && "border-[#B9DED2] bg-greenLight/70 text-starbucks",
        tone === "red" && "border-red-100 bg-red-50 text-red-700",
        tone === "orange" && "border-orange-100 bg-orange-50 text-orange-700",
        tone === "green" && "border-green-100 bg-green-50 text-green-700",
        tone === "slate" && "border-stone-200 bg-stone-50 text-stone-700",
        className
      )}
      {...props}
    />
  );
}

export function RecommendationBadge({
  value,
  className
}: {
  value: Recommendation;
  className?: string;
}) {
  return (
    <Badge className={cn("justify-center border", recommendationTone(value), className)}>
      {value}
    </Badge>
  );
}
