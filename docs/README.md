# Documentation

Use this folder as the documentation hub for the Gmail Job Tracker.

| Document | Purpose |
|---|---|
| [`SETUP_GUIDE.md`](SETUP_GUIDE.md) | Complete A-to-Z installation and deployment guide |
| [`Gmail_Job_Tracker_Setup_Guide.pdf`](Gmail_Job_Tracker_Setup_Guide.pdf) | Printable PDF generated automatically from the setup guide |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture and design decisions |
| [`STATUS_LOGIC.md`](STATUS_LOGIC.md) | Recruiter/application matching and status progression |
| [`HISTORICAL_BACKFILL.md`](HISTORICAL_BACKFILL.md) | Historical Gmail batch processing |
| [`TESTING.md`](TESTING.md) | Synthetic test plan and verification checklist |
| [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | Common problems, causes, and fixes |
| [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) | Screen-by-screen video walkthrough script |
| [`AUDIO_SCRIPT.md`](AUDIO_SCRIPT.md) | Short project audio/presentation script |

## PDF automation

The GitHub Actions workflow at `.github/workflows/build-setup-guide-pdf.yml` regenerates the printable setup PDF whenever `SETUP_GUIDE.md` or the PDF workflow changes.
