---
name: add-skill
description: Use when the user wants to add a new skill to the ai-skills marketplace, or says "add a skill for X" / "I need a skill that does X" and it should live in the shared repo.
---

# Adding a skill to ai-skills

Find the repo checkout (the directory containing `.claude-plugin/marketplace.json` with name `ai-skills`; ask once if not found). The repo is **public**: no employer names, internal URLs, secrets, or private ticket IDs in anything you write.

## Steps

1. **Check for overlap.** Skim `plugins/ai-skills/skills/*/SKILL.md` descriptions. Extend an existing skill instead of adding a near-duplicate.
2. **Create** `plugins/ai-skills/skills/<kebab-name>/SKILL.md`:
   - Frontmatter: `name` (matches folder) and `description` starting "Use when..." with concrete triggers only, never a workflow summary.
   - Body: **short (aim under 400 words)**. Core rule, steps, red flags. Move rarely-needed detail into sibling reference files and link them so they load on demand. Skills cost tokens every time they trigger.
   - Scripts go beside the SKILL.md; keep them LF and run `bash -n` on shell scripts.
3. **Register.** Add a row to the README skills table. Bump the patch version (minor for a new skill) in both `.claude-plugin/marketplace.json` and `plugins/ai-skills/.claude-plugin/plugin.json`, keeping them equal.
4. **Sanity check.** Grep the new files for anything private; confirm the frontmatter parses.
5. **Commit and push** with a message like `feat: add <name> skill` (ask before pushing if the user didn't already say to). Then tell the user to run `/plugin marketplace update ai-skills` and `/reload-plugins`.
