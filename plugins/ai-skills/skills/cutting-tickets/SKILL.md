---
name: cutting-tickets
description: Use when asked to cut, create, or generate tracker tickets from an approved tech plan or design doc, or when a plan was approved and its work needs breaking out.
---

# Cutting Tickets from a Tech Plan

Turn an approved plan's Milestones into tracker work: one project, one milestone per plan milestone, one issue per checklist item, then link each ticket back into the plan. Use whatever tracker (Linear, Jira, GitHub Issues) and doc tooling is connected; where the tracker lacks a concept, use the closest equivalent or skip it.

**Faithful transcription, not elaboration.** The plan was already reviewed. Don't invent scope, split tasks, re-estimate, or rewrite descriptions. A vague item is feedback for the author: flag it and ask.

## Gate: approved plans only

Check the plan's status field (or a filled-in approval/sign-off line). If it isn't approved, make no tracker calls; tell the user and preview what would be cut (milestones, issues, points, likely team). Proceed only if the user explicitly overrides after being told.

If the plan doc or the tracker isn't accessible, stop and say which one.

## Steps

1. **Parse the plan.** Extract status, team/domain (match a tracker team by name; ask if no clean match), each `Milestone N: <Name>` with its checklist items, the `(N)` point estimates (missing ones are created without an estimate and flagged), the tech lead (suggest as assignee, never assign unasked), and any existing ticket links in checklist items (those are already cut).
2. **Project.** Look for a project link in the plan. Ask one question: use that existing project or create a new one (plan name minus "Tech Plan:", matched team, lead, one-line summary, plan URL in the description)?
3. **Milestones.** Create one per plan milestone, named exactly as in the plan. Reuse an existing one with the same name.
4. **Issues, idempotently.** For each item without a ticket link, create an issue: title = item text minus the estimate, same team/project/milestone, estimate = the number, description = one line of milestone context linking the plan, the item verbatim, and only the directly relevant tech-requirement bullets. Link the plan URL. Don't set state, sprint, priority, or labels unless asked. Report skipped items as "already cut".
5. **Link back.** Append each ticket URL to its checklist item in the plan: `<item> (N) - <ticket URL>`. This is what makes re-runs idempotent, so do it even if some creations failed. Don't copy ticket descriptions into the doc.
6. **Report.** Project link, milestones created or reused, issues with IDs and points, skipped items, and flags (missing estimates, vague items, failures).

## Avoid

Cutting from an unapproved plan because the user seemed rushed; embellishing descriptions; duplicating tickets on re-run (always scan for existing links first); leaving back-links unwritten after an interruption.
