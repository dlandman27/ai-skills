---
name: systematic-debugging
description: Use when hitting a bug, test failure, or unexpected behavior, before proposing a fix
---

# Systematic Debugging

Adapted from `obra/superpowers` (MIT, see `LICENSE-superpowers`).

**No fix without a root cause.** Guessing wastes more time and tokens than investigating.

## Process

1. **Reproduce and read.** Read the full error and stack trace. Reproduce reliably. Check what changed recently (`git diff`, deps, config).
2. **Trace to the source.** Follow bad data or state backward up the call chain to where it originates; fix there, not at the symptom. In multi-layer systems, log at each boundary once to find which layer breaks. See `root-cause-tracing.md`.
3. **Compare with working code.** Find a similar working path and list every difference.
4. **One hypothesis at a time.** State it ("X is the cause because Y"), make the smallest change that tests it, change one variable only. If it fails, revert and form a new hypothesis; don't stack fixes.
5. **Fix and prove.** Write a failing test that reproduces the bug (`ai-skills:test-driven-development`), apply one fix, confirm the test and suite pass.

## Stop and rethink

If 3 fixes have failed, the problem is probably architectural or your model of it is wrong. Stop, summarize what you know, and discuss with the user before trying a 4th.

## Red flags

"Quick fix now, investigate later", "just try changing X", "it's probably Y" with no evidence, proposing a fix before tracing the data flow.

## References (load only if needed)

- `root-cause-tracing.md` - tracing bad values back through the call stack
- `defense-in-depth.md` - validating at every layer once the cause is found
- `condition-based-waiting.md` - replacing arbitrary sleeps in flaky tests
- `find-polluter.sh` - bisecting which test pollutes shared state
