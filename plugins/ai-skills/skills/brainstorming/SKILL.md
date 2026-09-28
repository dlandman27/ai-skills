---
name: brainstorming
description: Use when starting any new feature or change, scoping a ticket or spike, mapping remaining work on a partially-done ticket, or when asked "scope out" / "what would it take" — before any code is written, tickets are cut, branches are created, or a tech plan is drafted.
---

# Brainstorming

Turn an idea, ticket, or spike into a validated design through collaborative dialogue. Derived from `superpowers:brainstorming` (obra/superpowers, MIT; see `LICENSE-superpowers` at the plugin root), adapted for a ticket-driven workflow.

<HARD-GATE>
No implementation until the outcome is approved: no code, no scaffolding, and — in a plan-then-ticket workflow — no tickets and no branches. This applies regardless of how simple the work seems.
</HARD-GATE>

## Process

1. **Explore context first.**
   - Ticket (if one exists) in your tracker (Linear, Jira, GitHub Issues, etc.): description, comments, linked PRs — establish what's already done before asking anything.
   - Code is the source of truth: search across the relevant repos (e.g. `gh search code`, or grep locally) and read them directly.
2. **Ask clarifying questions one at a time.** One question per message, multiple choice preferred. Understand purpose, constraints, success criteria — and if work is partially done, what the miss actually is.
3. **Propose 2–3 approaches** with trade-offs and a recommendation. Keep the rejected ones — they become the tech plan's Rejected Solutions section.
4. **Size the work and hand off** (table below).
5. **Get explicit approval** on the design/scoping before the handoff step.

## Sizing the Handoff

| Signal | Handoff |
|---|---|
| Multi-service, product-driven (PRD/designs exist), new infra, would need a review meeting | Write a **design doc / tech plan** (in your docs tool — Notion, Confluence, or a markdown file in the repo) |
| Single ticket, spike output, or a gap on mostly-done work | Post a **scoping comment on the ticket**: what exists today, what the miss is, remaining work per service/repo |

When in doubt, ask the user which artifact they want — that's one question.

## Key Principles

- One question at a time; never a wall of questions
- YAGNI ruthlessly — cut features from every design
- Explore existing patterns before proposing new ones
- Go back and revise when an answer invalidates an earlier assumption

## Red Flags — Stop

- About to write code, cut a ticket, or create a branch → the gate is violated
- Drafting a full tech plan for a one-ticket miss → wrong handoff size
- Just asked three questions in one message → back to one at a time
