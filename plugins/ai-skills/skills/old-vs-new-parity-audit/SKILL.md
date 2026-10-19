---
name: old-vs-new-parity-audit
description: Use when asked to compare an old and a new implementation of the same feature (v1 vs v2, a rewrite, a migration, a flagged replacement) for differences, gaps, regressions or "what isn't the same" before rollout.
---

# Old-vs-new parity audit

**Core rule:** a finding is something the new version gets *wrong*, not something it does *differently*. The old version is not the spec. Many differences are deliberate.

## Steps

1. **Fan out read-only.** Run one agent per area so no area is skimmed: loading/empty/error/refresh, rendering per item type, interactions and side effects (analytics, writes other screens read), lifecycle (logout, account or mode switch, background, focus), and UI/platform (sizes, a11y). Give each agent the known/filed/intentional list so it reports only new findings.
2. **Evidence from both sides.** Every finding quotes file:line from the old AND the new code. A claim without the old side's code isn't a parity finding.
3. **Classify each finding:**
   - **BUG:** the new version is broken or wrong for the user (blank, stuck, clipped, flashing, wrong or stale data, lost event or side effect).
   - **LOOKS-BROKEN:** deliberate, but a user or QA would report it. Always surface these.
   - **INTENTIONAL:** deliberate and fine. A code comment, a consistent design rule, or the user saying so settles it. List these in one line each at most.
   - **UNCLEAR:** can't be decided from code. Name the device or data check that would decide it.
   - An issue present in **both** versions isn't a parity finding. List it once under "pre-existing in both".
4. **Try to disprove before reporting.** Run a separate skeptical pass over every finding: does the old version behave the same? Is it already handled elsewhere (an interceptor, a parent gate)? Drop or reword what doesn't survive. Verify the highest-severity ones yourself.
5. **Report bugs first:** BUGs, then LOOKS-BROKEN, then one line each for INTENTIONAL, UNCLEAR and pre-existing. Log the verified list on the audit ticket, and keep it updated when findings are dropped or added.
6. **Tickets follow the request.** If the user asked for tickets, file one per verified BUG after step 4. If they didn't, report and offer. Either way, filing ends the turn: start no fixes until told to.

## Red flags

- Listing every difference as a finding.
- "v1 does X, so v2 should too" with no user-visible harm.
- A finding with only new-side evidence.
- Filing a ticket before the skeptical pass.
- Performance items mixed into a parity list (track them separately).
