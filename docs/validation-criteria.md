# Testing & Validation Criteria

This document operationalizes Section 8 of the Protocol Specification v2 ("Testing & Validation Criteria"). It defines how the protocol's output is validated against the test dataset in `data/test-cves.json`, and the pass/fail targets used to judge whether the AI-assisted TVA review protocol is performing as designed.

## How Validation Works

For each of the 18 CVEs in `data/test-cves.json`, the field `ground_truth_outcome` records the outcome (ACT / ATTEND / TRACK) that a human TVA analyst would assign by applying the decision cascade in Section 2 and the thresholds in Section 3. When the AI-assisted protocol evaluates the same 18 CVEs, its recommended outcome is compared against `ground_truth_outcome` to compute the accuracy metrics below. Any disagreement is categorized as one of: AI error, ambiguous input, or legitimate judgment difference (see Misclassification Analysis below).

## 8.1 Coverage Requirements

| Dimension | Minimum Sample | Status in `test-cves.json` |
|---|---|---|
| Total CVEs evaluated | 15–20 | 18 |
| Each outcome tier represented (ACT, ATTEND, TRACK) | ≥ 5 each | ACT: 5, ATTEND: 7, TRACK: 6 |
| RTO tiers exercised | All 6 tiers touched | Tiers 0–5 all present |
| Threat intel signal coverage | ≥ 3 actively-relevant cases | 5 cases |
| Escalation candidates | ≥ 4 flagged cases | 5 cases |

**Coverage status: PASS.** All Section 8.1 minimums are met by the current dataset.

## 8.2 Accuracy Metrics

| Metric | Definition | Target | How to Compute |
|---|---|---|---|
| Outcome agreement (AI vs ground truth) | % of AI outcome recommendations matching `ground_truth_outcome` | ≥ 80% | (# matching outcomes) / 18 |
| Escalation candidate accuracy | % of true escalation cases (where `escalation_candidate: true`) correctly flagged by the AI | ≥ 90% (recall over precision — flag extra rather than miss critical cases) | (# correctly flagged of the 5 true escalation cases) / 5 |
| OLA precedence correctness | % of cases where `recommended_ola` correctly reflects the tighter of outcome/severity OLAs | 100% | Manual check of `recommended_ola` field per Section 7.3 |
| Misclassification analysis | Every disagreement categorized | 100% categorized | See table below |

### Misclassification Categories

| Category | Meaning |
|---|---|
| AI error | The AI's reasoning log shows a logic or threshold mistake at a specific cascade stage |
| Ambiguous input | The input data itself was incomplete or contradictory, making either outcome defensible |
| Judgment difference | Both outcomes are logically defensible; reflects a legitimate analyst disagreement, not a protocol failure |

## 8.3 Consistency & Explainability

| Metric | Definition | Target |
|---|---|---|
| Determinism | Same input set produces identical reasoning logs across multiple runs | 100% |
| Reasoning log completeness | All 6 cascade stages populated with input/decision/rationale | 100% |
| Traceability | Every outcome reproducible from the input snapshot plus protocol version | 100% |

## 8.4 Governance Checklist

- [ ] Human sign-off preserved for all ACT and escalation candidate cases (no exceptions)
- [ ] All analyst overrides recorded with analyst identity, timestamp, and rationale
- [ ] Audit trail recoverable for any individual reasoning log without auxiliary lookups

## Notes for Reviewers

- This document defines *how* to score the protocol's output. The actual scoring run (feeding `data/test-cves.json` through the implemented decision logic and comparing results) happens once the engineering team has the cascade logic wired up in the dashboard.
- If the dashboard's existing `data/vulnerabilities.json` uses a different schema than `test-cves.json`, the two should be reconciled before running validation, so the accuracy metrics above are computed against one consistent dataset.
