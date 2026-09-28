# Tech Plan Failure Patterns

The specific failure modes tech plan reviewers commonly flag. Reference this when scoring a plan section-by-section.

## 1. Too much _how_, not enough _what_

**What it looks like:** The plan contains data models, state diagrams, schema definitions, pseudocode, function signatures, or detailed protocol descriptions in the body.

**Why it's wrong:** All of that is liable to change once tickets are written and implementation starts. A tech plan should set main objectives, milestones, assumptions, and risks — the things that _won't_ change. Implementation detail belongs in tickets.

**How to call it out:** "This section is doing implementation work. The durable bullet here is [outcome restatement]. The rest can move to tickets."

**Example from real review feedback:**

> "There's lots of good thoughts in here around domain models, data models, state diagrams, and more, but most of it shouldn't be in a tech plan... once you get into ticket writing and implementation, all of that is liable to change. But something like a bullet on the user story... is unlikely to change."

## 2. Implementation-shaped user stories

**What it looks like:** Bullets in the Product Requirements section that describe _how_ the system behaves rather than _what outcome_ it delivers.

Examples of implementation-shaped bullets:

- "The deck builder atomically claims the cards it places into a deck"
- "The deck builder writes its output transactionally"
- "The deck builder orders the selected cards using a cryptographically secure shuffle"

The outcome version of each:

- "No two users can ever be issued the same physical card"
- "A failed build leaves no partial decks or stuck inventory"
- "Cards in a deck are in non-predictable order"

**How to call it out:** Recommend reshaping where the outcome is genuine, and cutting where the outcome is already covered by another bullet.

## 3. Tech Requirements as a design spec

**What it looks like:** The Tech Requirements section has nested subsections like "Service shape," "Triggers," "Data contract," "Build mechanics," "Operability" — each with several detailed prescriptive bullets.

**Why it's wrong:** The template's Tech Requirements is supposed to be a short list of named services with one-line purposes. Like: "billing-service — three new endpoints for upload, execute, status." Not a design document.

**How to call it out:** Recommend deleting the entire implementation-detail block. Keep Technologies & Services as a short list with one-line purposes. Move durable outcomes to user stories, cut everything else to live in tickets.

## 4. Missing structural sections

**What it looks like:** Sections in the template that are missing from the tech plan.

**Why it matters:** The template sections are there for a reason. Any omission should have a really good reason.

**How to call it out:** List them explicitly. "Add an Owners table at the top." "Suggested Rejected Solutions: [name 1-3 specific alternatives the plan implicitly chose against]."

## 5. Scope creep into shared scaffolding

**What it looks like:** The plan owns work that should really be a separate tech plan — building shared infrastructure, setting up a new service, creating a database, building a migration tool, generic test data loading.

**Why it matters:** If two plans both depend on the same scaffolding, one of them ends up doing the work and the other waits. Better to break the scaffolding into its own plan with its own owner so dependencies are visible.

**How to call it out:** Suggest spinning the shared work into its own tech plan. The original plan starts at "depend on the scaffolding being done" and stays focused.

**Example from real review feedback:**

> "If you even want to build a separate tech plan for just creating some of the shared resources, like building the data models, creating a database in alpha, building a migration tool, creating the tables, and then a milestone for adding test data, that's totally cool too."

## 6. The plan is too long

**What it looks like:** Multi-page plans with extensive prose, multiple diagrams, exhaustive sub-bullets.

**Why it's wrong:** The bar reviewers set is "concise focused tech plans so we can get pointed feedback to you and get you approved and rolling on next steps." Length is friction. The reference good example is short — a few user stories, a few services, a few milestones, a few open questions.

**How to call it out:** Identify the section(s) doing the most damage to length and recommend specific cuts. Don't ask the author to "tighten everything" — name the bullets that should go.

## 7. Vague open questions

**What it looks like:** "Database choice TBD." "Need to figure out the algorithm." Questions with no owner tag.

**Why it matters:** Open questions are supposed to identify the specific person whose decision unblocks the work. Without an owner, they sit.

**How to call it out:** Recommend adding owner tags ("— Eng," "— Product,"). Suggest which open questions might already have answers in linked docs.

## 8. Risks without mitigations

**What it looks like:** "Risk: throughput could be a problem." No mitigation.

**Why it matters:** A risk without a mitigation is an open question, not a risk. Risks earn their place in the plan by having a lever the team can pull if they materialize.

**How to call it out:** Either add a mitigation or move the bullet to Open Questions.

## 9. Assumed reality, untested

**What it looks like:** Multiple milestones build features on the assumed shape or behavior of a real external system (a third-party API/feed format, a production-like DB or network config, a model/provider's real output) without an early task that actually hits the real thing.

**Why it matters:** Adversarial review and tests against synthetic fixtures cannot catch a wrong assumption about the real world — only contact with the real system can, and it's usually near-free to check early. Finding this on milestone 5 instead of milestone 1 means every milestone built on top of the bad assumption needs rework.

**How to call it out:** "Milestones 2 through 4 all assume [X] about the real system, but nothing checks that until [Y]. Move a cheap smoke test against the real thing into Milestone 1."

## 10. Depth on one layer, no check on the consumer

**What it looks like:** The plan builds backend/producer capability across several milestones (or several phased sibling plans) for a feature meant to surface somewhere else — a UI, a caller, a downstream job — without naming what already exists on the consuming side or confirming it's wired up to use the new capability.

**Why it matters:** Backend correctness says nothing about whether the feature is reachable. A plan can ship several fully-reviewed milestones of real capability that nothing calls, and the gap only surfaces when someone tries to use the finished feature end-to-end.

**How to call it out:** "This plan adds three milestones of [capability] but doesn't say what on the [UI/caller] side will use it. Add a line naming the consuming surface's current state (built / built-but-unwired / not started) and put a thin end-to-end slice in an early milestone."

## Anti-pattern: the review that does too much

Reviewers are not paid to design the system. The author owns the design. The reviewer's job is to flag structural issues, name missing pieces, and surface obvious alternatives. If the review ends up rewriting the plan, the review went too far. When in doubt, point at the gap and let the author fill it.
