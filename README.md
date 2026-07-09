# DTCC

DTCC x Duke - AI Vulnerability Project

## AI-Assisted TVA Review Dashboard

This repository contains a proof-of-concept dashboard for an AI-assisted Threat & Vulnerability Assessment review workflow.

## Product Direction

The prototype has moved from a simple threat-intelligence indicator toward a more nuanced governance model:

- No known threat actor activity
- Threat actors actively leveraging an exploit
- Threat actors specifically targeting the financial sector

Operations Level Agreements are driven by a simulated DTCC-style internal severity score. The score incorporates exposure, business risk, public vulnerability intelligence, and threat activity. It does not rely solely on CVSS severity.

Emergency criteria focus on vulnerabilities requiring accelerated remediation. The prototype intentionally reduces emphasis on TVA escalation as a primary workflow, since escalation is expected to occur less frequently than remediation prioritization.

## Data Provenance

The vulnerability records are hybrid PoC data:

- Public CVE identity, vulnerability title, CISA KEV inclusion, CISA KEV date added, CVSS where available, and EPSS scores are based on public sources.
- CISA KEV fields are checked against the CISA Known Exploited Vulnerabilities Catalog.
- EPSS values are from the FIRST EPSS API snapshot dated 2026-06-29.
- CVSS values are from CVE.org CNA records when available, with NVD used as a fallback for CVE-2023-34362.
- Enterprise-specific fields such as asset tier, business unit, internet-facing status, business criticality, mission dependency, threat actor activity, internal severity, OLA target, confidence, and AI reasoning are simulated for demo purposes.

This prototype does not use DTCC internal data, a scanner, a database, or live AI inference.

## SSVC-Inspired Logic

The recommendation engine uses an SSVC-inspired and DTCC-style decision flow for PoC demonstration. It is not a complete implementation of the official CISA SSVC model.

Each recommendation is derived from six explainable factors:

- Threat Activity
- Exposure
- Business Risk
- DTCC Severity
- OLA Target
- Remediation Decision

The first inputs use public vulnerability data such as CISA KEV, FIRST EPSS, and CVSS where available. The exposure, business risk, threat activity, DTCC severity, OLA, and remediation decision are simulated for the PoC.

## Project Decisions

- Threat intelligence should distinguish generic exploitation from financial-sector targeting.
- OLA targets should be derived from DTCC internal severity rather than CVSS alone.
- Emergency criteria should focus on accelerated remediation.
- Auditability should capture the AI recommendation, final analyst decision, override status, rationale, internal severity, OLA, and accelerated-remediation flag.

## Findings

- CVSS remains useful as an input but is insufficient as the sole prioritization driver.
- CISA KEV and EPSS improve threat context, but enterprise exposure and business impact are needed for actionable remediation decisions.
- A single consolidated remediation review view is clearer than separate, overlapping AI reasoning and SSVC path panels.

## Recommendations

- Treat this prototype as a decision-support layer, not a scanner or vulnerability management platform.
- Continue separating public vulnerability facts from simulated or internal enterprise context.
- If this PoC advances, replace simulated DTCC severity and threat activity with approved internal scoring rules and authoritative data sources.
