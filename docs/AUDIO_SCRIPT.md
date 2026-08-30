# Audio Project Breakdown Script

Recommended length: 3-5 minutes.

"This project is a Gmail-to-Google-Sheets job tracking automation built with Google Apps Script.

The problem I wanted to solve was manual job-search tracking. During an active search, there can be recruiter outreach, follow-ups, right-to-represent requests, client submissions, assessments, interviews, application confirmations, rejections, and offers across many separate Gmail threads. A spreadsheet becomes outdated quickly if every change has to be entered manually.

The automation uses Gmail as the source of truth. On a scheduled run it first looks for recruiter or vendor emails that I sent, then it detects incoming application confirmations, then it checks incoming email for recruiter-stage and application-status changes.

The system writes the data into a daily sheet and also maintains an All Jobs master view. A hidden Processed sheet stores the Gmail message ID and workflow type, which makes the scheduled process idempotent and prevents the same Gmail message from creating the same row repeatedly.

The classification is rule-based. I chose that intentionally because the signals are fairly explainable: phrases like thank you for applying, application received, right to represent, submitted to the client, interview availability, assessment, rejection, and offer language. The application detector also recognizes common ATS and job-board senders.

One important design decision is that status updates are not matched only by sender. Recruiters and ATS systems can work with multiple jobs, so the matching logic also considers Gmail thread context, recruiter email, company, job title, and position text. The code avoids ambiguous ties rather than guessing.

Another challenge was historical data. A mailbox may contain tens of thousands of messages, which cannot safely be processed in one Apps Script execution. I built batch backfills that save their current Gmail position in Script Properties and use temporary triggers to continue later.

The project also creates a Dashboard showing recruiter and application counts by status.

The main improvements I would make next are replacing offset-based history scanning with a more stable date or cursor strategy, using one incremental Gmail scan for faster live runs, and adding automated tests around the classification and extraction logic.

The repository contains the full Apps Script source, architecture, setup guide, troubleshooting documentation, security guidance, testing steps, and a video walkthrough script."
