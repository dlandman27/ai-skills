---
name: writing-tech-plans
description: Use when writing, drafting, or preparing a tech plan or technical spec for a feature or initiative, filling in a tech plan template, or asking what a section of a tech plan needs. For reviewing an existing plan, use ai-skills:tech-plan-review instead.
---

# Writing Tech Plans

## Before You Start

- Prerequisite: a **PRD** (or equivalent product requirements) exists, plus **design links** if the work is product-driven and has designs. Don't start without them.
- Use the team's tech plan template if one exists (ask the user for the link or look in the repo). Otherwise use the default section list below. Title the doc `Tech Plan: <Name>`.
- If the plan is big enough that its review would run 90+ minutes, split it into **phased sibling plans** (e.g. `Tech Plan: Billing Service — Beta` and `... — Launch`) that link to each other, each additive on the last.
- Keep it an outline, not an essay: a good plan is a few user stories, a short list of services, a few milestones, a few open questions.

## Default Template

Use these sections, in order, unless the team's template says otherwise:

1. Owners
2. Overview
3. Product Requirements / User Stories
4. Tech Requirements (Technologies & Services, Infrastructure, Dependencies)
5. Milestones
6. Open Questions
7. Assumptions
8. Risks
9. Supporting Technical Documents
10. Rejected Solutions

## Section-by-Section: What Good Looks Like

**Owners** — table rows PRD / Design / PM / Tech Lead / Reviewer(s) / Approved. Link the actual PRD and design with the owner's name in parens. **Leave Approved for humans** — it's a sign-off. Right under the table, state the repo and the issue-tracker project on one line.

**Overview** — 1–2 sentences on what the change accomplishes, then the **scope boundary**: which phase this plan covers, what's explicitly out, and links to sibling/follow-on plans. The reader must know what *this* plan ships before reading further.

**Product Requirements / User Stories** — one story per persona (`As a **user**...`, `As an **ops teammate**...`, `As the **business**...`). Include failure/backout behavior in the stories themselves (e.g. "a failed submission leaves my order exactly where it was"). Mark nice-to-haves and point them at Open Questions. Stories belonging to a later phase get one italic line linking to that phase's plan.

**Tech Requirements**
- *Technologies & Services*: one bullet per service/system. Name the repo, what changes in it (new tables, endpoints, states, crons — with names), and just as importantly what **doesn't** change ("*Beta:* untouched — shipping is free"). Record data-model decisions inline (e.g. snapshot-vs-mutable record of truth). Forward-link anything deferred to a later phase. Example: "`billing-service` — three new endpoints for upload, execute, status."
- *Infrastructure*: new jobs, webhooks, change-data-capture, monitors — name the pattern being copied if one exists.
- *Dependencies*: each with an **owner** and its resolution if decided ("owned by this project (decided in review)").

**Milestones** — `#### Milestone N: [Name] (ETA: ~X days/weeks)`, each a checklist of concrete tasks with **point estimates in parentheses**. Make tests an explicit line item per milestone. Ticket descriptions live here, **not in the issue tracker** — tickets are cut only after approval. Put feature flags/killswitches/experiments in an **early milestone** so code ships continuously. Note how QA runs (e.g. continuously alongside milestones vs a separate pass).

**Open Questions** — each question states the decision needed, who's involved, and **what breaks if it's left unresolved**. When a question is settled, don't delete it — append `→ Resolved (review): <decision>` in place. Resolved questions are the plan's decision log.

**Assumptions** — crisp, checkable constraints ("one-way door: no cancellation after confirm", "domestic only", "Beta is a strict subset of Launch — no throwaway").

**Risks** — each risk = failure mode → consequence → *Mitigation:*. Think about non-atomic writes, cron/notification failures, state re-entry, and cross-team coordination gaps.

**Supporting Technical Documents** — PRD, sibling plans, API contracts being mirrored or extended, designs, feature-flag configs, and the names/dates of relevant meetings.

**Rejected Solutions** — one block per alternative: name, what it was, *Why this was rejected:*. Include the obvious ones (new microservice, big-bang, different sequencing) so reviewers don't re-litigate them.

## Do's & Don'ts

**Do:** be concise — outline, not essay; update the doc as comment decisions land; involve other engineers/PMs early; ask for an early peer review; reference other tech plans; brainstorm/whiteboard.

**Don't:** write business-logic code or name functions (pseudo/example code is fine); cut tickets or branches before the plan is peer-reviewed or approved by a tech lead; plan exact release branches or delivery dates; start work before the plan finishes its review lifecycle.

## Getting It Reviewed

Before sharing, run `ai-skills:tech-plan-review` on the draft for structural feedback. Then share with the team, allow ~3–5 days of async feedback, then a ~1 hour review meeting. Include engineers from other teams whose services are touched. Review is about the technical approach, **not** wording or format. After approval the plan is "locked" and work can start any time.

If more detail is needed, supporting documents (backend, frontend, API contract) can be written as separate docs linked from Supporting Technical Documents.
