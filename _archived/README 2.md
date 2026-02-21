# Archived Files

Files in this directory were moved here during the code review remediation (2026-02-21).
They are no longer referenced by the application, CI/CD pipelines, or npm scripts.

## scripts/ (161 files)

Development utility scripts, data processing tools, and one-off migration scripts.
None are referenced in `package.json`, GitHub Actions workflows, or application code.

Categories include:

- Data ingestion/parsing (ESPN, Clay, Underdog, DraftKings)
- Player pool generation and stat processing
- Database migration and seeding utilities
- Testing/debugging helpers
- Asset generation (icons, sounds, placeholders)
- Environment and security auditing tools

If you need any of these scripts, move them back to `scripts/` and add the
appropriate npm script entry to `package.json`.
