import type React from "react";

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
  titleAdornment
}: {
  actions?: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
  titleAdornment?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A97C2B] sm:text-sm">
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl font-bold leading-tight text-navy sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {titleAdornment}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-black/55">
          {description}
        </p>
        <div className="mt-3 h-0.5 w-14 rounded-full bg-gold" />
      </div>
      {actions ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:pt-2">{actions}</div> : null}
    </div>
  );
}
