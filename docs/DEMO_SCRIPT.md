# Video Walkthrough Script

Recommended length: 5-7 minutes.

Use synthetic data only.

## 00:00 - Problem

"During an active job search, recruiter conversations, application confirmations, RTRs, submissions, assessments, interviews, rejections, and offers are scattered across Gmail. I built this automation so my job-search spreadsheet updates itself instead of relying on manual entry."

## 00:30 - Architecture

Show the README architecture diagram.

"A time-driven Google Apps Script job scans Gmail, classifies recruiter and application activity, writes structured rows into Google Sheets, records processed Gmail message IDs, updates status changes, and refreshes a dashboard."

## 01:00 - Sheet structure

Show `TEMPLATE`, one dated sheet, `All Jobs`, and `Dashboard`.

Explain the two sections:

- Recruiter / Vendor Emails Sent
- Portal / Direct Job Applications

Show the four-row spacing between them.

## 01:45 - Recruiter tracking

Send a synthetic recruiter reply/outreach email.

Run or wait for the live automation.

Show the new row with company, recruiter name, email, phone (if available), job title, status, and Gmail link.

## 02:30 - Recruiter status progression

Use synthetic replies to demonstrate stages such as:

```text
Replied -> RTR -> Submitted -> Interview
```

Explain that the matcher uses thread/job/company evidence and status-progression safeguards.

## 03:30 - Portal application tracking

Show a synthetic "Thank you for applying" email.

Show the portal row with portal, company, position, application number, Applied status, and Gmail link.

## 04:15 - Application status update

Show a synthetic assessment/interview/rejection message and the existing application row changing status rather than creating a new application.

## 04:50 - All Jobs and historical backfill

Explain that daily tabs handle new activity while `All Jobs` provides a permanent master view.

Show `checkAllJobsBackfillProgress()` logs with synthetic or sanitized values.

Explain why historical Gmail is processed in batches.

## 05:35 - Dashboard

Show today's counts and status breakdowns.

Explain that the Dashboard is refreshed by the master automation.

## 06:00 - Automation trigger

Show Apps Script Triggers with the hourly `runJobTrackerAutomation` trigger. Hide account-identifying details.

## 06:20 - GitHub

Show repository structure, README, source, setup guide, security documentation, and troubleshooting guide.

## Closing

"The project is intentionally rule-based and transparent so I can debug false positives, control status progression, and extend ATS support without depending on an opaque model. The next improvements would be incremental Gmail cursors, automated tests, and deeper analytics."

## Recording safety

Never show:

- Real personal inbox messages
- Real recruiter contact information
- Private Google Sheet ID
- Gmail thread IDs
- OAuth/Apps Script credentials
- Real application numbers
