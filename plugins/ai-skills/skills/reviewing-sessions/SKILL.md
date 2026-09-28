---
name: reviewing-sessions
description: Use when a work session or ticket wraps and lessons should be captured — the user asks for a session review, retro, or "what went well / what would have helped", or asks whether a correction they made mid-session should change a skill — or after any session with notable user interruptions, corrections, reverts, or rework.
---

# Reviewing Sessions

## Overview

Turn session friction into durable improvements. The transcript is the evidence; every proposal must trace to a specific moment in it. A review produces **memories and proposals — never direct edits to team skills**.

## Step 1 — Collect evidence (scan, don't recall)

Walk the actual transcript for these signals; quote the user verbatim:

- User interruptions and redirections ("it is in the shared-libs folder above…")
- Corrections phrased as questions ("I think we have a workflow for this… correct?") — usually the user being polite about a mistake
- Denied permission prompts, failed commands, wrong-repo/wrong-file detours
- Reverted or amended commits, stripped diff churn, any rework
- What carried the session: which skill or process step prevented a problem

## Step 2 — Triage each finding to a destination

| Finding | Destination |
|---|---|
| Machine- or user-specific fact (paths, checkouts, accounts) | Personal memory — never a team skill |
| Team process/knowledge gap likely to recur | Skill proposal (Step 3) |
| Single-repo knowledge (release flow, quirks) | That repo's docs/CLAUDE.md — closest to where it's needed |
| Mechanically checkable (formatting, branch names) | Automation (hook, lint rule, CI) — not documentation |
| One-off with no recurrence argument | Mention in the review; create nothing |

## Step 3 — Skill proposals, not skill edits

A proposal contains: the session moment (verbatim), what it cost, why it will recur, the target skill and section, and draft wording. Capture the agent's actual rationalization while fresh — that is real RED-phase data.

But the session mistake only proves the *need*; it says nothing about whether your *wording* fixes it. Before committing a skill edit, verify an agent actually follows the new wording on the failing scenario.

## Output shape

1. **What went well** — tied to the specific skill/step that caused it, so it isn't broken later
2. **Findings** — each: what happened → cost → root cause → destination
3. **Actions** — memories written now; skill proposals; items intentionally dropped, with why

## Common mistakes

| Mistake | Fix |
|---|---|
| Encoding local paths into a team skill | Personal memory. Layouts vary per machine. |
| Proposing process details the session never demonstrated | Mark as assumption; verify in the repo before including |
| Reviewing from memory of the session | Scan the transcript for the Step 1 signals |
| A new skill for every lesson | Prefer a section in the existing skill that should have triggered |
