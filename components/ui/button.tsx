import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "border-greenAccent bg-greenAccent text-primary-foreground hover:bg-starbucks",
        variant === "outline" && "border-border bg-white text-navy hover:border-greenAccent hover:bg-greenLight/40 dark:bg-card dark:text-foreground",
        variant === "ghost" && "border-transparent bg-transparent text-muted-foreground hover:bg-greenLight/40 hover:text-navy dark:hover:bg-slate-800 dark:hover:text-white",
        variant === "danger" && "border-red-600 bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "h-9 px-3",
        size === "md" && "h-10 px-5",
        size === "icon" && "h-10 w-10",
        className
      )}
      {...props}
    />
  );
}
