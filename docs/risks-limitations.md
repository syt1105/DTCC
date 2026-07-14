# Project Risks, Limitations & Mitigations

This document summarizes the known limitations of the AI-Assisted TVA Review protocol (Section 9 of the Protocol Specification v2) and the mitigation strategy for each. It is intended to give DTCC reviewers and engineering teams a transparent view of what this proof-of-concept can and cannot fully validate within the current project scope.

## Summary Table

| # | Limitation / Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | No access to DTCC production data | Real-world accuracy cannot be fully verified within the capstone timeline | Protocol designed to accept DTCC's existing inputs without modification. Validated on public CISA SSVC analyses and synthetic asset context. |
| 2 | EPSS not yet operational in DTCC's stack | Predicted-likelihood gate cannot be fully tested end-to-end against production data | Protocol is additive: KEV alone covers the highest-priority cases. EPSS thresholds are documented for activation once integration completes. |
| 3 | AI hallucination or reasoning drift | Incorrect classification could mis-prioritize critical CVEs | Reasoning log structure enforces deterministic stage-by-stage logic. All ACT and Emergency-Critical outcomes require human sign-off. Full audit trail preserved. |
| 4 | Public threat intel lag | Public sources (NVD, CISA KEV) may lag commercial intel that DTCC actually consumes | Protocol documented to accept commercial intel as a drop-in replacement for public sources via the threat intelligence input schema (Section 4.4). |
| 5 | 5-week timeline, 3-person team | Limited capacity for exhaustive CVE validation | PoC focused on 15–20 representative CVEs. Methodology documented for extension to larger validation sets post-capstone. |
| 6 | Synthetic asset dataset | Asset criticality and exposure values are simulated rather than measured | Dataset covers all three criticality categories with documented assumptions. Replacement with real DTCC asset inventory requires only conforming to the input schema in Section 4.5 — no protocol redesign needed. |

## Notes for Reviewers

- **Scope discipline:** these limitations reflect deliberate scoping decisions for a 5-week capstone project, not gaps in the protocol's design logic. Each mitigation shows a documented path to closing the gap once the corresponding DTCC production input becomes available.
- **Human oversight is non-negotiable:** regardless of data limitations, the protocol never removes human sign-off for ACT-tier and Emergency-Critical outcomes (see Section 6.1). This is the primary safeguard against risk #3 above.
- **Extensibility:** risks #1, #2, #5, and #6 all resolve the same way — by swapping synthetic/public inputs for DTCC's production equivalents through the schemas already defined in Section 4. No changes to the decision cascade (Section 2) or thresholds (Section 3) are required.
