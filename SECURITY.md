# Security and Privacy

## Data handled by the project

This automation can access Gmail message metadata/content and a Google Sheet selected by the user. Treat both as private data.

## Repository rules

Never commit:

- A real Google Sheet ID from a private tracker
- Gmail exports or copied email bodies
- Recruiter names, emails, phone numbers, or application IDs from real activity
- OAuth credentials or refresh tokens
- API keys, client secrets, passwords, or private keys
- `.clasp.json` from a private Apps Script project
- Screenshots that expose personal inbox data

## Public source configuration

`Code.gs` uses the placeholder:

```javascript
const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
```

Replace it only in your private Apps Script deployment. Do not commit the real value back to the public repository.

For a more advanced deployment, store the ID in Apps Script Script Properties and read it at runtime.

## Gmail behavior

The tracker reads Gmail information required for classification and creates Gmail thread links in the spreadsheet. The published code should be reviewed before authorization, and users should grant only the permissions needed for their deployment.

## Demo safety

Use synthetic recruiter names, companies, email addresses, phone numbers, job titles, and application numbers in screenshots or demo recordings.

## Reporting a security issue

Do not open a public GitHub issue containing credentials or personal Gmail data. Remove sensitive information before sharing logs or examples.
