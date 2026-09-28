---
name: review
description: Use when the user asks to "review this PR", "review my diff", or "self-review before push" and wants a blind review against the repo's own AGENTS.md/CLAUDE.md. Opt-in; costs a full model run per round.
---

# review - blind local review

A CI review bot beats an in-thread self-review because it has no author context: fresh process, merge tree, read-only tools, and only the repo's `AGENTS.md`/`CLAUDE.md` as rubric. This skill reproduces that locally.

**Cost:** each round is a full headless model run. Run **one round** by default. Only run more if the user asks or the first round found real issues, and stop after one quiet round.

## Fastest path

```
${CLAUDE_PLUGIN_ROOT}/skills/review/review.sh <repo-dir> <pr-number>
```

Runs a headless `claude -p` (default `--model sonnet`, override with `REVIEW_MODEL`) on the PR merge ref with read-only tools, prints the review, posts nothing. Run it in the background.

## Manual round (no PR yet, or no `gh`)

1. Build the merge tree in a scratch worktree, never the working tree:
   - PR: `git fetch origin pull/<pr>/merge:refs/ai-review/<pr> --force && git worktree add --detach <scratch> refs/ai-review/<pr>` (if the merge ref won't fetch, the PR conflicts; fall back to `pull/<pr>/head` and say so)
   - Unpushed: worktree at the branch tip, then `git merge --no-edit origin/<base>` inside it. A conflict is itself a finding.
2. Spawn a **fresh subagent** (cheap model, never a fork of this session) with read-only tools (Read/Grep/Glob, `git diff`, `git log`). Prompt = PR metadata + the contents of `AGENTS.md` (else `CLAUDE.md`, else "infer conventions from sibling files"). No description of intent, no author framing. Tell it not to run builds or tests.
3. Verify each finding against the code yourself; fix what survives; run the gates yourself.
4. Clean up: `git worktree remove --force <scratch>` and `git update-ref -d refs/ai-review/<pr>`.

## What this catches that self-review misses

Comments or PR text describing behavior the code lacks; references to symbols/files that don't exist; test expectations derived from the code under test; faked values that can't occur in production; two files describing one field differently.

## Report

Findings first, `path:line` each, most severe first, with confidence on uncertain ones; then a verdict (ship / ship-after-fixes / needs-rework). Current state only: drop anything already fixed. Never post to GitHub, never push. Answer a finding by fixing code or a test, not by adding explanatory prose.
