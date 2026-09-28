---
name: tech-plan-review
description: Use when the user shares a tech plan or technical spec (a link, file, or pasted text) and asks for a review, feedback, a sanity check, or "is this ready" before peer review. Gives fast structural feedback against the tech plan template and common failure patterns. Use before answering — never freehand a tech plan review when this skill applies.
---

# Tech Plan Review

A skill for reviewing engineering tech plans against the team's planning standards. The goal is to give the author concrete, structural feedback before they take the plan to peer review — so they get pointed comments fast instead of round-tripping on shape.

## Why this skill exists

Tech plans usually get reviewed by a small number of senior engineers. Reviewers consistently push plans back for the same reasons:

- Too much _how_, not enough _what_ — the plan reads like an implementation doc instead of an outline
- Domain models, data models, state diagrams, schemas, and pseudocode in the plan body — these belong in tickets
- Missing or empty Owners table, ETAs, point estimates, or Rejected Solutions section
- Tech Requirements section has been turned into a design spec instead of "what technologies and services we'll use, one line each"
- User stories that describe implementation behavior rather than outcomes

Catching these before the plan is shared saves a full review cycle. The point of this skill is _fast structural feedback_, not deep design critique. Design critique is what the review meeting is for.

## Sources of truth

| What                                                            | Where                                                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template structure, planning process, Do's & Don'ts, lifecycle  | The team's template / process docs — ask the user for the link or look in the repo. If none exist, use the section structure defined in `ai-skills:writing-tech-plans` (the default template). |
| A reference "good plan" to anchor density against               | Ask the user if the team has one; otherwise use the density description under "What good looks like" below.                                                                                  |

The failure-patterns reference (`references/failure-patterns.md`) is bundled locally and captures opinionated review feedback.

## When to run the full review

Run the full review when the user shares a tech plan and signals they want feedback. If they share a plan without context, ask once: "Want me to review this against the tech plan template?" Then proceed.

If the document is clearly not a tech plan — a PRD, a meeting note, a decision register, an RFC — say so and stop. Don't force the template onto something else.

## The review

The output is a structured critique in chat. Do not edit the plan unless the user asks. The review has four parts: a one-sentence verdict, a section-by-section pass against the template, the top three issues the author should fix before peer review, and (optionally) suggested Rejected Solutions to consider adding.

### Step 1: Read the plan

Read the plan in full (open the file, or fetch the link with whatever tool is available). If the plan links to other docs as Supporting Technical Documents (PRD, architecture proposal, decision register, dependent tech plans), do not auto-fetch them — they're context for the author, not required reading for the review. Read them only if the user asks a question that depends on their content.

### Step 2: Get the template and read the failure patterns

Find the team's template (ask the user or look in the repo). If none exists, use the default section list: Owners, Overview, Product Requirements / User Stories, Tech Requirements, Milestones (point estimates, explicit test line items), Open Questions, Assumptions, Risks, plus Supporting Technical Documents and Rejected Solutions. The template owns the definition of what sections must be present and what they're for.

Then read `references/failure-patterns.md` for the catalog of specific issues reviewers flag most often. These are the patterns to look for as you walk the plan section by section.

### Step 3: Score it against the template

For each section the template defines, decide: present and good / present but weak / missing. "Weak" usually means one of the failure patterns — match against them explicitly so the feedback is concrete.

### Step 4: Write the review

Use this structure:

```
## Verdict
[One sentence. "Close to ready, two structural issues to fix" or "Significant rework needed before review."]

## Section-by-section
[Walk through each template section. For each, say what's present, what's missing, and what would change. Keep it tight — one short paragraph or bullet per section. Use the section names from the template in use.]

## Top three things to fix before peer review
[The three highest-leverage edits. Specific. "Add an Owners table" is better than "fill in metadata." If a section needs to be deleted because it's implementation detail, name the specific bullets that should go.]

## Rejected Solutions to consider
[Optional. If you can identify 1-3 design alternatives that an experienced reviewer will ask about — things that aren't fully captured elsewhere in the plan — list them with a one-line "why it lost." Skip this section if the plan already has a Rejected Solutions block or if no obvious alternatives exist.]
```

Keep the whole review under 500 words unless the plan is genuinely a mess. The stated bar from reviewers is "concise focused tech plans so we can get pointed feedback" — the review should model the same brevity.

## What "good" looks like

A good reference plan has this shape:

- Three short user stories
- Tech Requirements as a list of services with one-line purposes
- Three named infra components
- Two milestones with point estimates on every task
- A couple of open questions, a couple of assumptions

That's the density and shape to anchor on. If the plan you're reviewing is much longer or much more detailed than that, it's probably overweight.

## Tone

The author took time to write the plan. Respect that. Be direct about what needs to change and why, but don't pile on — most plans have two or three structural issues, not twenty. Lead with the verdict so they know whether they're close or far. If the plan is in good shape, say so plainly.

Never tell the author what their plan should say — you don't own the design. Tell them what's structurally missing or misshapen, and let them write the content.

## What this skill does not do

- It does not approve or block a plan — only a tech lead can do that
- It does not edit the plan unless the user explicitly asks
- It does not write tickets or design docs
- It does not review the underlying design decisions — that's the peer review meeting's job
- It does not fetch every linked doc reflexively — read only what's needed to answer a specific question

## Reference files

- `references/failure-patterns.md` — the specific failure modes reviewers flag most often, with examples. Read this every time the skill runs.
