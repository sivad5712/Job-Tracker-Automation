# Contributing

Contributions are welcome when they improve detection accuracy, documentation, testing, reliability, or privacy.

## Before opening a pull request

1. Do not include real Gmail content or private recruiter/application data.
2. Do not include your real Google Sheet ID or Apps Script project ID.
3. Keep changes focused and explain the behavior being changed.
4. Test classification changes with synthetic examples.
5. Verify that duplicate-prevention and status-progression behavior still works.
6. Update documentation when behavior changes.

## Suggested contribution areas

- Unit-test harnesses for pure helper functions
- Additional ATS/portal sender rules
- Better company and position extraction
- Date/cursor-based historical backfill
- Incremental live Gmail scanning
- Dashboard analytics
- Error handling and observability
