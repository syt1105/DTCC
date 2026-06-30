import { Bell, Database, Moon, ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const settings = [
  {
    icon: ShieldCheck,
    title: "SSVC Policy Mode",
    value: "DTCC PoC Defaults",
    description: "Uses mock SSVC decision thresholds for ACT, ATTEND, and TRACK."
  },
  {
    icon: Database,
    title: "Data Source",
    value: "Mock JSON",
    description: "No backend, scanner, database, or external integration is connected."
  },
  {
    icon: UserCheck,
    title: "Analyst Identity",
    value: "Analyst A",
    description: "Decisions are recorded locally for prototype audit demonstration."
  },
  {
    icon: Bell,
    title: "Notifications",
    value: "Toast Only",
    description: "Approval and override actions show in-app confirmation messages."
  },
  {
    icon: Moon,
    title: "Theme",
    value: "Toggle in UI",
    description: "Use the theme button in the bottom-right corner on desktop."
  },
  {
    icon: SlidersHorizontal,
    title: "Confidence Scoring",
    value: "Simulated",
    description: "Confidence values are derived from mock vulnerability attributes."
  }
];

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Prototype configuration for the AI-assisted TVA review workflow.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <p className="text-sm text-muted-foreground">This page is intentionally read-only for the PoC.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {settings.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="rounded-lg border border-border bg-slate-50 p-4 dark:bg-slate-900" key={item.title}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-navy dark:text-white">{item.title}</div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Badge tone="blue">{item.value}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
