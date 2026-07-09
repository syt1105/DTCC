"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({
  message,
  visible
}: {
  message: string;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "fixed right-5 top-5 z-50 flex items-center gap-3 rounded-[12px] border border-green-100 bg-white px-4 py-3 text-sm font-semibold text-navy shadow-enterprise transition-all dark:bg-card dark:text-white",
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0 pointer-events-none"
      )}
    >
      <CheckCircle2 className="h-5 w-5 text-track" />
      {message}
    </div>
  );
}
