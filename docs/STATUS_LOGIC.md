# Status Logic

## Recruiter / Vendor stages

Supported values:

```text
Sent
Follow-up Sent
Replied
RTR
Submitted
Assessment
Interview
Rejected
Offer
Closed
```

### Detection priority

The recruiter detector prioritizes stronger outcomes/stages before the generic `Replied` state. Typical high-signal phrases include offer language, rejection language, interview scheduling, assessments, submission language, and Right-to-Represent (RTR) language.

Quoted historical content is reduced by extracting the newest reply text, which lowers the chance that an old phrase such as "interview" keeps re-triggering from a quoted thread.

### Progression rules

Active-stage rank is approximately:

```text
Sent < Follow-up Sent < Replied < RTR < Submitted < Assessment < Interview
```

Terminal/final handling is special:

- `Offer` is final and may override earlier outcomes.
- `Rejected` can override active stages.
- `Closed` can override active stages, subject to final-state safeguards.
- A terminal state should not normally be reopened by a lower stage.

The purpose is to avoid backward updates such as `Interview -> Replied` when a generic recruiter message arrives later.

## Portal / Direct Application stages

Supported values:

```text
Applied
Assessment
Interview
Rejected
Offer
Withdrawn
```

Typical progression:

```text
Applied < Assessment < Interview
```

Final outcomes include `Rejected`, `Offer`, and `Withdrawn`.

## Matching strategy

The code combines thread and text evidence rather than matching only on a sender address.

Recruiter matching can use:

- Same Gmail thread
- Exact recruiter email
- Job-title text
- Company text

Portal matching can use:

- Same Gmail thread
- Position text
- Company text

Where candidate scores tie, the matcher can return no match rather than guessing.

## Why this matters

Recruiters and automated ATS senders often handle multiple roles. A sender-only match can update the wrong application. Thread-aware and role-aware matching reduces that risk.
