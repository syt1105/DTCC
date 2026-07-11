import { Bell, Database, Moon, ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
        <PageHeader
          description="Prototype configuration for the AI-assisted TVA review workflow."
          eyebrow="Prototype Configuration"
          title="Settings"
        />

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <p className="text-sm text-muted-foreground">This page is intentionally read-only for the PoC.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 xl:grid-cols-2">
              {settings.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="rounded-[12px] border border-border bg-ceramic/60 p-5 dark:bg-slate-900" key={item.title}>
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-greenLight/70 text-starbucks">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="font-bold text-navy dark:text-white">{item.title}</div>
                          <Badge className="h-auto w-fit shrink-0 whitespace-normal px-2.5 py-1 text-center leading-5" tone="blue">
                            {item.value}
                          </Badge>
                        </div>
                        <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
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
