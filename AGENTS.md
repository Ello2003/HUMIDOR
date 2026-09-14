# Agent Guidelines & Persistent Project Rules

## Versioning & Changelog Mandate
- **Always update version history**: Whenever making feature additions, bug fixes, UI enhancements, or structural changes to The Humidor, you **MUST** update `src/data/versionHistory.ts`:
  1. Increment `APP_VERSION` appropriately (e.g. `v2.8.0` -> `v2.8.1` or `v2.9.0`).
  2. Prepend a new `VersionHistoryEntry` to `VERSION_HISTORY` detailing the release title, summary, and bullet-point highlights.
  3. Ensure the Version History modal reflects the current release details accurately for the user.
