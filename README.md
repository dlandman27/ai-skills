# ai-skills

General-purpose engineering skills for Claude Code, packaged as a plugin marketplace.

## Install

```
/plugin marketplace add <path-or-github-repo>
/plugin install ai-skills@ai-skills
/reload-plugins
```

## Skills

| Skill | Use it for |
|---|---|
| `systematic-debugging` | Root-cause investigation before proposing any fix |
| `test-driven-development` | Red-green-refactor for features and bugfixes |
| `verification-before-completion` | Evidence before claiming work is done |
| `readability` | Flattening conditionals, naming booleans, avoiding explanatory comments |
| `brainstorming` | Turning an idea/ticket into an approved design before code |
| `writing-tech-plans` / `tech-plan-review` | Authoring and reviewing implementation plans |
| `writing-rfcs` | Cross-cutting proposals (RFC / ADD / SAP) |
| `cutting-tickets` / `executing-tickets` | Plan → tracker tickets → verified code |
| `review` | Opt-in blind local PR review against the repo's `AGENTS.md`/`CLAUDE.md` (sonnet by default) |
| `spec-review` | Blind check that the diff matches the ticket |
| `add-skill` | Add a new skill to this marketplace |
| `reviewing-sessions` | Retro after a session; feed lessons back into skills |

## Credits


## Cost

Skills are kept short (about 230-1,100 words each) and rarely-needed detail lives in reference files loaded on demand. The review skills are opt-in, default to one round, and use a cheap model. Subagents are used only where independence matters.
