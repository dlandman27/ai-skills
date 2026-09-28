---
name: writing-rfcs
description: Use when proposing a cross-cutting change to engineering process, architecture, or a technology/vendor choice that affects more than one team or repo — an RFC, Architecture Design Document (ADD), or Software Architecture Proposal (SAP) circulated for async review before a sync. Triggers include "write an RFC / proposal / ADD / SAP", a tooling/framework/vendor migration, or any "should we do this, and which direction" decision needing cross-team buy-in. For a single-initiative implementation plan use ai-skills:writing-tech-plans; to review a plan use ai-skills:tech-plan-review.
---

# Writing RFCs (RFC / ADD / SAP)

An RFC/ADD/SAP is the **"should we, and which direction"** decision doc for a change that spans more than one team or repo — an engineering-process change, an architecture decision, or a technology/vendor choice. You write it up and **circulate for async review first, then schedule a sync** — not the other way around.

## This, Not a Tech Plan

- **RFC/ADD/SAP** — a shared decision or standard others must buy into. Cross-team. Async comments → sync. This skill.
- **Tech Plan** — how we build an *already-agreed* thing: milestones, point estimates, one initiative. Use `ai-skills:writing-tech-plans`.
- Unsure? Does it change a decision/standard others must agree to → RFC. Does it lay out milestones to build a settled thing → tech plan. An accepted RFC often *produces* a tech plan.

## Before You Start

- Use the team's RFC/ADD/SAP template if one exists (ask the user for the link or look in the repo, e.g. a `docs/rfcs` folder). Otherwise use the default outline below. Fill each section and delete any instructional text as you go.
- Fill the header block: **Status** (`Draft | In Review | Accepted | Rejected | Superseded`), Author(s), Reviewers, Created, Last updated, **Source / context** (the thread, incident, or discussion that prompted this), Related tickets/docs.

## Default Template Outline

1. Header block (see above)
2. Summary
3. Background
4. Problem Statement
5. Proposal
6. Alternatives Considered
7. Addressing Objections
8. Risks & Mitigations
9. Rollout Plan
10. Open Questions
11. Related Docs

## The Two Bars That Make It a Proposal, Not an Opinion

Reviewers check for these; a draft missing them bounces.

1. **Posture tag on every sub-decision** — `Proposed` (have a position, want pushback before settling), `Working assumption` (proceeding to unblock, happy to revisit), or `Open` (no position, soliciting input). Reviewers must know how settled each piece is.
2. **"What would change our mind" on every decision** — the concrete evidence or event that would make you revisit. Every decision needs one. This is the line between a proposal and an opinion.

## Section-by-Section: What Good Looks Like

**Summary** — 2–3 sentences, readable alone. A reviewer reads only this and knows whether to keep going and what changes if it's accepted.

**Background** — current state + the *specific* trigger (an incident, a raised question, a noticed inconsistency), not "we should do better." Link the prior thread/decision if this follows one.

**Problem Statement** — concrete: name the repos/services/teams affected. If someone raised a pointed question ("why would X make this a worse fit?"), state it verbatim so the doc can be checked against it.

**Proposal** — per significant decision: **Direction** (what we propose) / **Rationale** (what it's better *for*, not just "better") / **What would change our mind** — each tagged with its posture.

**Alternatives Considered** — including *doing nothing* if that's a real option. This is what lets reviewers disagree productively instead of re-litigating options you already ruled out.

**Addressing Objections** — if the proposal has already drawn pushback, state the objection in its **strongest** form, then answer it. If it's partly right, fold it into Proposal/Open Questions rather than arguing around it.

**Risks & Mitigations** — for anything with a blast radius (shared infra, high-traffic services, customer-facing behavior), separate **what stays the same** (existing safety that doesn't change) from **the real, isolated delta** this introduces. Each risk = failure mode → *Mitigation:*.

**Rollout Plan** — sequencing/phasing/migration order. Call out the **lowest-risk first step** and why, and what "done" looks like.

**Open Questions** — unresolved but non-blocking to circulating. Assign an **owner** per question, not just a bullet.

**Related Docs** — runbooks, prior proposals, precedent ("we already did this successfully for X").

## Common Mistakes

- A decision with no "what would change our mind" → it reads as an opinion.
- Untagged decisions → reviewers can't tell settled from open.
- Vague trigger ("we should do better") instead of the concrete event that prompted it now.
- Objections left implicit as unexamined reasons not to act — steelman and answer them.
- Importing tech-plan shape (milestones + point estimates) — that belongs in the tech plan *after* this is accepted.
- Jumping to a review meeting before async comments.

## After Acceptance

Flip **Status → Accepted** and record the decision in place. If it needs building, the implementation doc is a **tech plan** (`ai-skills:writing-tech-plans`); cut tickets only from the approved tech plan.
