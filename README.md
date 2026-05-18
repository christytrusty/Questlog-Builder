# Questlog Builder

https://questlog-builder.christytrusty.workers.dev

Questlog Builder is a static website for creating and editing Questlog JSON projects for Minecraft modpacks.

The editor is meant to make Questlog quest files easier to write, check, import, validate, and export without needing to hand-edit every JSON file.

Questlog Builder is an independent editor for Questlog JSON projects and is not affiliated with the Questlog mod authors unless stated otherwise.

## What It Does

- Edit quest and chapter JSON in a browser.
- Import existing Questlog JSON files or project ZIPs.
- Export files back into the Questlog folder layout.
- Validate common missing fields and broken references.
- Use starter quest templates and save custom quest templates.
- Preview export readiness before downloading a project ZIP.
- Drag and drop JSON or ZIP files into the editor.
- Personalize the website with premade themes, curated fonts, editor toggles, and sound settings.
- Use optional UI sounds from replaceable files in `website files/ui-sounds/`.
- Enable verified mod ID suggestion packs for selected popular mods.

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
- `v2.5`
- `v2.8`

Current public release: `v2.8`.

Codex was used to help pull Minecraft IDs, run local checks, and prepare releases.
