import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-navy placeholder:text-muted-foreground dark:bg-card dark:text-foreground",
        className
      )}
      {...props}
    />
  );
}
