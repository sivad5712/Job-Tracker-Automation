# Troubleshooting

## Daily sheet is not created

**Check:** `TEMPLATE` exists and is spelled exactly.

**Run:** `createTodaySheet()` manually and inspect the execution log.

## "All Jobs sheet was not found"

Run `createAllJobsSheet()` before All Jobs backfills or Dashboard refreshes.

## Recruiter email is not detected

The recruiter detector expects multiple job/recruiting signals in the outgoing email or earlier messages in the same thread. Review the subject/body and test with `testRecruiterSentEmails()`.

## Application confirmation is not detected

Run `testPortalApplicationEmails()` and inspect the logged confidence/reason. The rule engine weighs strong confirmation phrases more heavily than generic application words.

## Job alert is incorrectly detected as an application

Review the message for very strong confirmation language. Strong confirmation evidence can intentionally override recommendation/job-alert penalties. Add a negative pattern only after reproducing the false positive with synthetic text.

## Duplicate rows appear

Check `_Processed`. Duplicate prevention is based on workflow type + Gmail Message ID. Separate Gmail messages that refer to the same application can still require a higher-level application deduplication rule.

## Status did not update

Possible causes:

- Message was promotional rather than a direct status update
- No reliable existing row matched
- Candidate rows tied
- The requested status would move the record backward
- The message was already processed

## Historical backfill appears stuck

Run:

```javascript
checkAllJobsBackfillProgress()
```

Confirm the relevant `...ACTIVE` property is `true` and the saved Gmail position changes over time. Check Apps Script Executions for errors.

## Backfill accidentally restarted

Starting a historical workflow initializes its saved position. Avoid repeatedly running starter functions. Message-ID duplicate protection limits repeated writes, but a restarted scan wastes time.

## Trigger does not run

Open Apps Script -> Triggers and verify a time-driven trigger exists for `runJobTrackerAutomation`.

Also check Apps Script -> Executions for authorization failures or runtime errors.

## Dashboard shows zero applications

The Dashboard reads `All Jobs`, not the current daily sheet. If historical portal backfill has not run and live `All Jobs` application sync has not added records, application counts can be zero.

## Dashboard refresh fails but tracking continues

The master automation catches Dashboard refresh errors so a Dashboard issue does not stop the core tracker. Inspect the log entry beginning with `Dashboard refresh failed:`.

## Script execution is slow

The current live functions scan a recent Gmail window independently. A future optimization should use one incremental cursor or one shared Gmail scan per master run.

## Gmail history completeness concerns

The current historical code uses numeric Gmail search offsets. Because mailbox ordering can change over long runs, perform a final audit or migrate to date-window-based backfill if strict completeness is required.
