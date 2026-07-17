import { DynamicVulnerabilityPage } from "@/app/cves/[id]/dynamic-vulnerability-page";
import { getVulnerability } from "@/lib/vulnerabilities";

export default async function VulnerabilityPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vulnerability = getVulnerability(id);

  return <DynamicVulnerabilityPage id={id} staticVulnerability={vulnerability} />;
}
