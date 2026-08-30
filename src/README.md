# Apps Script Source

The original project was developed as one large `Code.gs` file. For GitHub readability and easier review, the public source is split into numbered `.gs` modules.

Google Apps Script loads all `.gs` files in the same project into one shared global namespace, so these files are intended to be added to **one standalone Apps Script project**.

## Installation

1. Create a standalone Google Apps Script project.
2. Add the `.gs` files from this directory to that project.
3. Keep the public placeholder in GitHub, but in your private Apps Script copy replace:

```javascript
const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
```

with the ID of your tracker spreadsheet.
4. Save the project and follow [`../docs/SETUP_GUIDE.md`](../docs/SETUP_GUIDE.md).

## Module order

The numeric prefixes preserve the original source order and make the workflow easier to understand. Runtime execution does not depend on the file order; functions can call functions defined in other `.gs` files in the same Apps Script project.

## Privacy

The source in this repository has been sanitized. Do not commit a real private spreadsheet ID, Gmail exports, recruiter data, credentials, or OAuth secrets.
