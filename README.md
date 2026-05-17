# Questlog Builder

Questlog Builder is a static website for creating and editing Questlog JSON projects for Minecraft modpacks.

The editor is meant to make Questlog quest files easier to write, check, import, and export without needing to hand-edit every JSON file.

## What It Does

- Edit quest and chapter JSON in a browser.
- Import existing Questlog JSON files or project ZIPs.
- Export files back into the Questlog folder layout.
- Validate common missing fields and broken references.
- Use starter quest templates as examples.

## Project Layout

- `website files/` contains the live static website files.
- Open `website files/index.html` directly, or serve the folder with any simple static file server.

## Questlog File Paths

Quest files belong in:

```text
config/questlog/quests/
```

Chapter files belong in:

```text
config/questlog/chapters/
```

Questlog IDs are based on file paths, so names and folders matter.

## Version History

This repository keeps the public website versions in order:

- `v2.0`
- `v2.2`
- `v2.3`

Newer work is added after it passes the local release checklist.
