# Project Demo

The repository now includes a ready-to-watch **60-second animated explainer**:

[`../assets/job-tracker-animated-demo.mp4`](../assets/job-tracker-animated-demo.mp4)

The README also uses `assets/demo-poster.png` as the clickable demo poster.

## What the animated demo explains

The video is intentionally privacy-safe and uses synthetic examples only. It covers:

1. **The problem** - recruiter, application, RTR, interview, and status emails are scattered across Gmail.
2. **The solution** - Gmail activity flows through Google Apps Script into Google Sheets.
3. **Recruiter/vendor tracking** - outgoing job-related messages become structured recruiter rows.
4. **Application tracking** - ATS/job-board confirmations become normalized application rows.
5. **Status progression** - later emails update existing records instead of creating duplicates.
6. **Historical reconstruction** - older Gmail is processed in scheduled batches.
7. **Dashboard** - job-search activity becomes measurable summary data.
8. **Privacy** - the public repository contains code and synthetic media, not private job-search records.

## Optional live screen-recording walkthrough

The animated explainer is the default demo. If a longer real product walkthrough is recorded later, use the following 5-7 minute script with **synthetic data only**.

### 00:00 - Problem

"During an active job search, recruiter conversations, application confirmations, RTRs, submissions, assessments, interviews, rejections, and offers are scattered across Gmail. I built this automation so my job-search spreadsheet updates itself instead of relying on manual entry."

### 00:30 - Architecture

Show the README architecture diagram.

"A time-driven Google Apps Script job scans Gmail, classifies recruiter and application activity, writes structured rows into Google Sheets, records processed Gmail message IDs, updates status changes, and refreshes a dashboard."

### 01:00 - Sheet structure

Show `TEMPLATE`, one dated sheet, `All Jobs`, and `Dashboard`.

Explain the two sections:

- Recruiter / Vendor Emails Sent
- Portal / Direct Job Applications

Show the four-row spacing between them.

### 01:45 - Recruiter tracking

Send a synthetic recruiter reply/outreach email, run or wait for the live automation, and show the new recruiter row with company, recruiter, contact details, job title, status, and Gmail link.

### 02:30 - Recruiter status progression

Use synthetic replies to demonstrate stages such as:

```text
Replied -> RTR -> Submitted -> Interview
```

Explain that the matcher uses thread/job/company evidence and status-progression safeguards.

### 03:30 - Portal application tracking

Show a synthetic "Thank you for applying" email and the resulting portal row with portal, company, position, application number, Applied status, and Gmail link.

### 04:15 - Application status update

Show a synthetic assessment/interview/rejection message and the existing application row changing status rather than creating a new application.

### 04:50 - All Jobs and historical backfill

Explain that daily tabs handle new activity while `All Jobs` provides a permanent master view. Show sanitized `checkAllJobsBackfillProgress()` logs and explain why historical Gmail is processed in batches.

### 05:35 - Dashboard

Show today's counts and status breakdowns. Explain that the Dashboard is refreshed by the master automation.

### 06:00 - Automation trigger

Show Apps Script Triggers with the hourly `runJobTrackerAutomation` trigger. Hide account-identifying details.

### 06:20 - GitHub

Show the repository README, animated demo, professional PDF guide, source modules, setup guide, security documentation, and troubleshooting guide.

## Recording safety

Never show:

- Real personal inbox messages
- Real recruiter contact information
- Private Google Sheet IDs
- Gmail thread IDs
- OAuth/Apps Script credentials
- Real application numbers
