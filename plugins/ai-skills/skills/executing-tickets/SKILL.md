---
name: executing-tickets
description: Use when asked to work on, pick up, or implement a ticket ("work on PROJ-123", "knock out this ticket"), or when mid-ticket and about to branch, touch another repo, or claim work is done.
---

# Executing a Ticket

Take a ticket to verified, committed code on a correctly named branch, then stop. Adapted from `obra/superpowers` (MIT, see `LICENSE-superpowers`).

**Boundary:** no `git push`, no PR, no moving the ticket to In Review/Done. Offer those as a next step.

## Gate: scope

Read the real ticket and comments with whatever tracker tooling is connected (never work from a paraphrase; check linked/sibling tickets). If the *change itself* is undefined (no acceptance criteria, no linked plan, description is only a symptom), stop and use `ai-skills:brainstorming` first. A missing detail on a scoped ticket is one question, not this gate. "Run with it" delegates execution, not inventing scope.

## Steps

1. **Repos.** List every repo the scope touches. For others, look for a sibling checkout; if absent, ask where it lives. Don't stub around a missing repo or silently shrink scope.
2. **Branch.** In each repo, branch off the up-to-date default branch as `PROJ-123/short-description`. Never work on main.
3. **Execute.** Short ordered task list (dependencies first), then per task: test first (`ai-skills:test-driven-development`), implement. Small single-repo tickets: do it inline. Use subagents only for several independent tasks, with a cheap model.
4. **Verify.** In each touched repo run the full suite, lint, and typecheck (`ai-skills:verification-before-completion`). Until green, say "verification running", not "done".
5. **Commit and report.** Commit per repo referencing the ticket ID. Comment on the ticket: changes per repo, branches, verification results, assumptions. Leave it In Progress. Tell the user the branches and offer to push and open PRs.

## Red flags

Coding without acceptance criteria; committing to main; stubbing a dependency in another repo; claiming done without full-suite output from every touched repo; running `git push` or `gh pr create`.
