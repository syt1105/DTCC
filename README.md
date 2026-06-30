# DTCC

DTCC x Duke - AI Vulnerability Project

## AI-Assisted TVA Review Dashboard

This repository contains a proof-of-concept dashboard for an AI-assisted Threat & Vulnerability Assessment review workflow.

## Data Provenance

The vulnerability records are hybrid PoC data:

- Public CVE identity, vulnerability title, CISA KEV inclusion, CISA KEV date added, CVSS where available, and EPSS scores are based on public sources.
- CISA KEV fields are checked against the CISA Known Exploited Vulnerabilities Catalog.
- EPSS values are from the FIRST EPSS API snapshot dated 2026-06-29.
- CVSS values are from CVE.org CNA records when available, with NVD used as a fallback for CVE-2023-34362.
- Enterprise-specific fields such as asset tier, business unit, internet-facing status, business criticality, mission dependency, confidence, and AI reasoning are simulated for demo purposes.

This prototype does not use DTCC internal data, a scanner, a database, or live AI inference.

## SSVC-Inspired Logic

The recommendation engine uses an SSVC-inspired decision flow for PoC demonstration. It is not a complete implementation of the official CISA SSVC model.

Each recommendation is derived from six explainable factors:

- Exploitation
- Automatable
- Technical Impact
- Mission Prevalence
- Business Impact
- SSVC Decision

The first three factors are driven primarily by public vulnerability data such as CISA KEV, FIRST EPSS, and CVSS. The mission and business factors are driven by simulated enterprise context.
