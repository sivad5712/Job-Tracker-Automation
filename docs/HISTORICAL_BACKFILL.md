# Historical Backfill

## Purpose

The live tracker handles new activity. Historical backfills reconstruct older Gmail job-search activity into `All Jobs`.

## Why batching is required

A Gmail account may contain tens of thousands of messages. One Apps Script execution should not attempt to process the entire mailbox. The project therefore uses:

- Small Gmail batches
- Script Properties for saved positions
- Temporary time-driven triggers
- Message-ID duplicate prevention
- Script locks

## Historical workflows

### Recruiter/vendor history

Start with:

```javascript
startAllJobsRecruiterBackfill()
```

Batch worker:

```javascript
runAllJobsRecruiterBackfillBatch()
```

The worker searches Sent mail, filters messages actually sent by the account owner, applies recruiter detection, writes matching rows to `All Jobs`, and stores the `ALL_RECRUITER` processing key.

### Portal/application history

Start with:

```javascript
startAllJobsPortalBackfill()
```

The worker searches historical mail, ignores messages sent by the account owner, detects real application confirmations, extracts portal/company/position data, writes records, and stores `ALL_PORTAL` processing keys.

### Portal status history

Start with:

```javascript
startAllJobsPortalStatusBackfill()
```

This workflow detects historical Assessment/Interview/Rejected/Offer/Withdrawn messages and matches them to applications already present in `All Jobs`.

### Recruiter status history

Start with:

```javascript
startAllJobsRecruiterStatusBackfill()
```

This workflow reconstructs recruiter stages such as Replied, RTR, Submitted, Assessment, Interview, Rejected, Closed, and Offer.

## Progress

Use:

```javascript
checkAllJobsBackfillProgress()
```

The function logs active flags, saved Gmail positions, and current `All Jobs` recruiter counts.

## Important operational rule

Do not repeatedly call a `start...Backfill()` function while that same backfill is active. Starter functions initialize the saved position and create the temporary trigger.

Use the progress checker instead.

## Emergency stops

Each historical workflow has a corresponding `stop...Backfill()` function that disables its active flag and removes its temporary trigger.

## Known limitation: offset pagination

The current code advances a numeric Gmail search offset. If new messages arrive during a multi-day backfill, Gmail result ordering can shift. Duplicate message IDs prevent duplicate writes when old threads are revisited, but offset shifts can theoretically skip items.

A stronger future implementation should use stable date windows or another cursor strategy, followed by a verification pass.
