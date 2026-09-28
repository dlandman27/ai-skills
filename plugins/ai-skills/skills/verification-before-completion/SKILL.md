---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, or before committing or opening a PR
---

# Verification Before Completion

Adapted from `obra/superpowers` (MIT, see `LICENSE-superpowers`).

**No completion claim without fresh evidence from a command run in this turn.**

Before saying something works: identify the command that proves it, run it in full, read the output and exit code, then state the result with the evidence. If it fails, report the actual status.

| Claim | Needs | Not enough |
|---|---|---|
| Tests pass | Test output: 0 failures | An earlier run, "should pass" |
| Lint/build clean | That command's own output | A different check passing |
| Bug fixed | Original symptom now passes | Code changed |
| Regression test works | Red-green: passes, fails with the fix reverted, passes again | One passing run |
| Subagent finished | Your own check of the diff | Its "success" report |
| Requirements met | Line-by-line check against the spec | Tests passing |

Red flags: "should", "probably", "seems to"; "Done!" before running anything; trusting partial checks; about to commit or open a PR unverified.
