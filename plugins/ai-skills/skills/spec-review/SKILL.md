---
name: spec-review
description: Use before undrafting a PR or handing work back, to check with a blind reviewer that the diff does what the ticket asked, no more and no less. Complements the review skill, which judges craft against AGENTS.md; this judges intent against the ticket from your tracker (Linear/Jira/GitHub Issue) plus any linked design doc.
---

# spec-review - did we build what was asked?

**Cost:** opt-in. Each round is a full subagent run. Use a cheap model (sonnet), run one round by default, and repeat only if it found `OWNER: code` findings you then fixed.

`review` asks *is this good code?* It reads `AGENTS.md` and the diff, and it will happily bless a
beautifully written implementation of the wrong thing. Nothing else in the loop catches that,
because the author is the only one holding the ticket in their head - and the author is exactly
who cannot check it.

This skill closes that gap: a fresh reviewer, the ticket verbatim, the diff, and nothing else.

| | author self-check | spec-review |
|---|---|---|
| holds | the ticket *and* every reason it was reinterpreted | the ticket as written |
| judges | "I decided X for good reason" | "the ticket says Y, the code does X" |
| catches | craft | silent scope cuts, quiet reinterpretations, undone requirements |

## The parity rules

Break any of these and the round is worthless.

1. **A fresh subagent, never in-thread**, and never the agent that wrote the code.
2. **The prompt is the ticket, verbatim, and nothing else** - build it with `build-prompt.sh`.
   No summary of what was built, no "note that I deliberately…", no defence of any choice. If a
   decision needs explaining, that explanation belongs in the PR body where a human sees it, not
   in the reviewer's prompt where it launders the decision.
3. **Read-only tools**: `Read, Grep, Glob, WebFetch, Bash(git diff*), Bash(git log*),
   Bash(gh pr diff*), Bash(gh pr view*)` plus whatever read-only tracker and docs tools you have (Linear, Jira,
   GitHub Issues, or a docs MCP) so it can open the linked design doc itself. No build, test, lint, or edit.
4. **The reviewer follows every link in the ticket.** Tickets are often one paragraph plus a
   design-doc URL, and the real requirements live in the linked doc.
5. **Deferred is not done.** Work split into a follow-up commit is a finding unless the ticket
   itself splits it that way - the reviewer reports it and the human decides.

## Who owns the finding

Every finding is `OWNER: code` or `OWNER: spec`, and the reviewer must label it.

- **`OWNER: code`** - the spec is right and the diff is wrong. Yours to fix, then re-run.
- **`OWNER: spec`** - the diff is right and the written spec is wrong or silent, or the answer
  needs a human (the product owner, an external provider, the design owner). **Never fix these by editing the
  ticket or the design doc.**

**Default to decide-and-log, not blocking.** An `OWNER: spec` finding does not stop the work: make
the best call you can - research it properly first, the answer is usually findable - record it in
the decisions file, and carry on to a finished PR. The summary at the end is where the human sees
every call you made and overrides the ones they disagree with. A PR is reversible; waiting is not
free.

Block and wait only when a wrong guess is costly and cannot be unwound (money, data, a public
commitment). Everything else gets decided.

This split is what makes the loop terminate. A reviewer holds no memory of the last round, so an
`OWNER: spec` finding comes back identically every time - looping on it never converges, it just
burns rounds. The run is clean when every survivor is `OWNER: spec`.

**Never amend a ticket or a design doc to close a finding.** The doc is someone else's record of
what was agreed; changing it to match the code launders a decision that was never made. Report it.

## The decisions file

Accepted `OWNER: spec` findings go in a decisions file next to the spec - one line each: the
finding, the call, and who made it. Pass it to the next round so a settled question stops coming
back. Nothing enters that file without the human's answer.

## Run it

```bash
${CLAUDE_PLUGIN_ROOT}/skills/spec-review/build-prompt.sh <repo-root> <TICKET-ID> <spec-file> <base-ref> <head-ref> \
  [decisions-file] > /tmp/spec-review-prompt.txt
```

`<spec-file>` is the ticket description dumped verbatim - fetch it with your tracker's MCP tool or
CLI (e.g. Linear `get_issue`, Jira, `gh issue view`) and write the body to a file with no edits, no headings of your own, no commentary.

Then spawn one subagent whose prompt is that file's contents, verbatim, with the tool set from
rule 3 and the repo root as its working directory.

## After it returns

- Each finding is **missing** (ticket asked, code doesn't), **extra** (code does, ticket didn't
  ask), or **reinterpreted** (code does something adjacent) - plus its owner.
- Fix every `OWNER: code` finding and re-run. Repeat until none are left.
- Print the `OWNER: spec` findings to the human as a short list: the spec phrase, what the code
  does instead, the evidence, and the decision needed. Then stop - do not guess, do not proceed
  as if answered, do not edit the doc.
- A *reinterpreted* finding is usually the valuable one, and it is usually `OWNER: spec`.
  Silently keeping a reinterpretation is the failure mode this skill exists to catch.
- Findings you disagree with get a reason in the thread, never a comment added to the file.
