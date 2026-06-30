"use client";

import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, SummaryCard, VulnerabilityTable, summaryConfig } from "@/components/dashboard-widgets";
import type { Recommendation } from "@/lib/types";
import { getSummaryCounts, sortByRecommendationPriority, vulnerabilities } from "@/lib/vulnerabilities";

const filterOptions: Array<Recommendation | "ALL"> = ["ALL", "ACT", "ATTEND", "TRACK"];

export default function QueuePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Recommendation | "ALL">("ALL");
  const summary = getSummaryCounts();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return vulnerabilities
      .filter((vulnerability) => {
        const matchesSearch =
          !normalized ||
          vulnerability.id.toLowerCase().includes(normalized) ||
          vulnerability.product.toLowerCase().includes(normalized) ||
          vulnerability.businessUnit.toLowerCase().includes(normalized);

        const matchesFilter = filter === "ALL" || vulnerability.recommendation === filter;
        return matchesSearch && matchesFilter;
      })
      .sort(sortByRecommendationPriority);
  }, [filter, query]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-white">CVE Queue Overview</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              AI-prioritized vulnerabilities based on SSVC decision logic and enterprise asset context.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search CVE or product..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {filterOptions.map((option) => (
                <Button
                  className={filter === option ? "bg-navy text-white hover:bg-navy" : ""}
                  key={option}
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter(option)}
                >
                  {option === "ALL" ? <Filter className="h-4 w-4" /> : null}
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(summaryConfig) as Recommendation[]).map((key) => {
            const config = summaryConfig[key];
            return (
              <SummaryCard
                count={summary[key]}
                description={config.description}
                icon={config.icon}
                key={key}
                label={key}
              />
            );
          })}
        </div>

        {filtered.length > 0 ? <VulnerabilityTable vulnerabilities={filtered} /> : <EmptyState />}
      </div>
    </AppShell>
  );
}
