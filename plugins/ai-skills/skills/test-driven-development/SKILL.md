---
name: test-driven-development
description: Use when implementing a feature or bugfix, before writing implementation code
---

# Test-Driven Development

Adapted from `obra/superpowers` (MIT, see `LICENSE-superpowers`).

**Write the test first and watch it fail.** If you never saw it fail, you don't know it tests the right thing.

## Cycle

1. **Red:** write one minimal test for one behavior, with a clear name and real code (mock only when unavoidable). Run it; confirm it fails for the expected reason (missing feature, not a typo).
2. **Green:** write the simplest code that passes. No extra features.
3. **Refactor:** clean up while tests stay green. Don't add behavior.
4. Repeat for the next behavior.

Test passes immediately? It's testing existing behavior; fix the test.

## Rules

- Code written before its test: delete it and redo it test-first. Don't keep it as "reference".
- Bug fix: write a test that reproduces the bug first, then fix.
- Skip TDD only for throwaway prototypes, generated code, or config, and only with the user's OK.
- Hard to test usually means the design is too coupled; simplify the interface.

## Before you finish

- Every new function or method has a test you saw fail first
- Edge cases and error paths covered
- Output pristine (no warnings), suite green

See `testing-anti-patterns.md` when adding mocks or test-only methods to production code.
