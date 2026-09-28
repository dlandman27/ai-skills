#!/usr/bin/env bash
# Assembles the spec-conformance reviewer prompt: the ticket verbatim, the refs to diff, and the
# repo's own bar. Nothing the author wrote about the change goes in — that is the whole point.
set -euo pipefail

repo_root=${1:?usage: build-prompt.sh <repo-root> <TICKET-ID> <spec-file> <base-ref> <head-ref>}
ticket=${2:?usage: build-prompt.sh <repo-root> <TICKET-ID> <spec-file> <base-ref> <head-ref>}
spec=${3:?usage: build-prompt.sh <repo-root> <TICKET-ID> <spec-file> <base-ref> <head-ref>}
base=${4:?usage: build-prompt.sh <repo-root> <TICKET-ID> <spec-file> <base-ref> <head-ref>}
head=${5:?usage: build-prompt.sh <repo-root> <TICKET-ID> <spec-file> <base-ref> <head-ref> [decisions-file]}
decisions=${6:-}

cd "$repo_root"
[[ -f $spec ]] || { echo "no spec file at $spec" >&2; exit 1; }

cat <<META
You are reviewing a change for spec conformance only.

REPO: $(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || basename "$PWD")
TICKET: $ticket
BASE: $base
HEAD: $head
DIFF: git diff $base...$head

The ticket below is the complete statement of what was asked. You have not been told anything
about how it was implemented, and you should not ask — read the diff.

Follow every link in the ticket. Tickets often carry the real requirements in a linked
design doc; open it (using your tracker or docs tools) and treat it as part of the spec.

Label every finding with an owner:

  OWNER: code   the spec is right and the diff is wrong.
  OWNER: spec   the diff is right and the written spec is wrong or silent, or the call needs a
                human (the product owner, an external provider, the design owner). Say what decision is needed.

Report findings in exactly three buckets, most important first:

  MISSING        the ticket (or its linked design) asks for it; the diff does not deliver it.
  EXTRA          the diff delivers it; nothing in the spec asks for it.
  REINTERPRETED  the diff delivers something adjacent to what was asked — a different data source,
                 a different heuristic, a renamed concept, a narrowed set of inputs.

For each finding give: the bucket, the exact spec phrase it comes from, the file and line in the
diff, and one sentence on the consequence. If the code contradicts a factual claim in the spec,
say which one is right and how you know.

Work that has been deferred to a follow-up is MISSING unless the ticket itself splits it out.

Judge only conformance to the spec. Code style, naming, and test craft are reviewed elsewhere —
skip them. Do not build, test, or edit anything. Post nothing.

End with two lists: the OWNER: code findings that should block, and the OWNER: spec findings that
need a human answer. If both are empty, say the change is conformant.

Return your review as your final message.

--- TICKET $ticket (verbatim) ---
META
cat "$spec"

if [[ -n $decisions && -f $decisions ]]; then
	printf '\n--- DECISIONS ALREADY MADE (do not re-raise these) ---\n'
	cat "$decisions"
fi
