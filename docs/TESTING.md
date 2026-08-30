# Testing Guide

Use synthetic Gmail messages whenever possible.

## 1. Spreadsheet connectivity

Run:

```javascript
testSpreadsheetConnection()
```

Verify the expected spreadsheet and tabs are logged.

## 2. Daily sheet creation

Run:

```javascript
createTodaySheet()
```

Verify a `YYYY-MM-DD` tab is created from `TEMPLATE` and a second run does not duplicate it.

## 3. Recruiter detection

Send a synthetic email containing multiple recruiter/job signals, then run:

```javascript
testRecruiterSentEmails()
```

Also test a non-job sent message to confirm it is ignored.

## 4. Recruiter row writing

Run:

```javascript
syncRecruiterSentEmailsToSheet()
```

Run it twice. The second run should skip already processed Gmail messages.

## 5. Application detection

Create synthetic incoming confirmations for several formats:

- "Thank you for applying"
- "We received your application"
- "Application submitted"

Run:

```javascript
testPortalApplicationEmails()
```

Then verify generic job alerts are not incorrectly treated as applications.

## 6. Portal row writing

Run:

```javascript
syncPortalApplicationsToSheet()
```

Verify company, position, application number, status, and Gmail link.

## 7. Recruiter status progression

Use one synthetic recruiter thread and test:

```text
Sent -> Replied -> RTR -> Submitted -> Interview -> Rejected -> Offer
```

Verify lower-stage messages do not move an advanced row backward.

## 8. Portal status progression

Use one synthetic application and send separate status messages for:

```text
Applied -> Assessment -> Interview -> Offer
```

Also test Rejected and Withdrawn.

## 9. Wrong-match test

Create two similar roles from the same sender and verify an ambiguous status message does not update the wrong record.

## 10. Master automation

Run:

```javascript
runJobTrackerAutomation()
```

Review logs for all five live stages and verify the Dashboard refresh succeeds.

## 11. Historical backfill

Use a test mailbox or a limited account before large-scale use. Verify that:

- Saved positions increase
- Temporary triggers exist during an active backfill
- Duplicate keys prevent repeated rows
- Temporary triggers are removed after completion
