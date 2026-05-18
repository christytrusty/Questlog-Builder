# Changelog

## v2.8

- Cleaned up the Advanced editor into clearer texture, overlay, panel, label, color, and badge groups.
- Added drag-and-drop import for `.json` and `.zip` files using the same safe import path as the Import/export menu.
- Polished templates with custom-template counts, custom highlighting, clearer Use template actions, and source-file metadata for templates made from quests.
- Upgraded Export ZIP into a clearer export readiness screen with ready/review/not-ready status, upload path reminders, clickable warning rows, and missing-chapter export blockers.
- Optional UI sounds now load replaceable `.wav` files from `website files/ui-sounds/`, with typing sounds, a top-right mute button, Settings toggles, and volume up to 200%.
- Added Website personalization for premade light/dark themes, selected theme pairing, curated fonts, editor toggles, and sound feel settings.
- Refreshed vanilla Minecraft Java 1.21.1 sound, item, block, and biome suggestions.
- Added verified mod ID suggestion packs generated from selected mod jars, while keeping internal counts and source notes out of the UI.
- Simplified the mod support selector so each row shows the mod name, mod ID, and a short creator-friendly description.

## v2.5

- Added an export preview flow focused on warning counts, missing data, and the Questlog install folders.
- Added a sample project ZIP fixture for import/export regression checks.
- Added right-click Make template for saving selected quests as custom reusable templates.
- Added custom-template filtering and per-template deletion.
- Added a left-sidebar Bulk delete flow with an in-app confirmation modal.
- Replaced browser delete popups with in-app delete confirmations.
- Added compact project status in Settings.
- Added a right-panel Save now button when autosave is turned off.
- Removed confusing Activity and Project tools panels from the visible UI.
- Cleaned the Settings support/status area.

## v2.3

- Added a changelog window with version selection.
- Improved the left quest/chapter sidebar and made it resizable.
- Added quest/chapter search and list sorting.
- Added validation navigation that jumps to likely problem fields.
- Added a guided first-visit tutorial.
- Improved tooltips and release checklist coverage.
- Fixed project ZIP exports to use the Questlog folder layout.

## v2.2

- Added safer browser autosave and recovery behavior.
- Added undo/redo history that survives reloads.
- Improved rename behavior and empty-name warnings.
- Reworked Add and Import/export menus.
- Added Settings controls for namespace, autosave, raw JSON, minified export, validation, reset, and tooltips.
- Added cache-busting and mixed-version warnings for safer Neocities updates.
- Fixed `questlog:quest_complete` so it does not export `required_amount`.

## v2.0

- Added the main static website version.
- Added quest templates.
- Added browser local-storage autosave and reset.
- Added missing/error detection.
- Added project ZIP import.
- Added Minecraft ID and sound suggestions.
- Improved quest-to-chapter linking.