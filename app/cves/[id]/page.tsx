import { notFound } from "next/navigation";
import { VulnerabilityDetail } from "@/app/cves/[id]/vulnerability-detail";
import { getVulnerability } from "@/lib/vulnerabilities";

export default async function VulnerabilityPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vulnerability = getVulnerability(id);

  if (!vulnerability) {
    notFound();
  }

  return <VulnerabilityDetail vulnerability={vulnerability} />;
}
