#!/usr/bin/env bash
# Run an AI PR review locally with the same guidance a CI review bot uses.
#
# Mirrors a typical CI PR-review workflow: same prompt (PR metadata + the repo's own
# AGENTS.md), the merge ref CI reviews, headless claude with the same read-only allowlist.
# Prints the review instead of posting it.
#
# Usage: review.sh <repo-dir> <pr-number> [-- extra claude args]
# Env:   REVIEW_LOG  override the saved-review path (default ~/.ai-skills-reviews/<repo>-<pr>-<stamp>.md)
# Env:   REVIEW_MODEL  model for the headless run (default: sonnet, to keep cost down)
set -euo pipefail

REPO_DIR="${1:?usage: review.sh <repo-dir> <pr-number>}"
PR="${2:?usage: review.sh <repo-dir> <pr-number>}"
shift 2
REPO_DIR="$(cd "$REPO_DIR" && pwd)"
NAME="$(basename "$REPO_DIR")"
SLUG="$(cd "$REPO_DIR" && gh repo view --json nameWithOwner -q .nameWithOwner)"

read -r URL BASE HEAD < <(gh pr view "$PR" -R "$SLUG" --json url,baseRefName,headRefName \
  -q '[.url,.baseRefName,.headRefName]|@tsv')

TMP="$(mktemp -d)"; WT="$TMP/pr$PR"
if ! git -C "$REPO_DIR" fetch -q origin "pull/$PR/merge:refs/ai-review/$PR" --force 2>/dev/null; then
  echo "warning: no merge ref (conflicted PR?) - falling back to head, which CI would not review" >&2
  git -C "$REPO_DIR" fetch -q origin "pull/$PR/head:refs/ai-review/$PR" --force
fi
git -C "$REPO_DIR" fetch -q origin "$BASE" 2>/dev/null || true
git -C "$REPO_DIR" worktree add -q --detach "$WT" "refs/ai-review/$PR"
cleanup() {
  git -C "$REPO_DIR" worktree remove --force "$WT" 2>/dev/null || true
  git -C "$REPO_DIR" update-ref -d "refs/ai-review/$PR" 2>/dev/null || true
  rm -rf "$TMP"
}
trap cleanup EXIT

GUIDANCE=""
for f in AGENTS.md CLAUDE.md; do
  if [ -f "$WT/$f" ]; then GUIDANCE="$(cat "$WT/$f")"; echo "guidance: $f" >&2; break; fi
done
if [ -z "$GUIDANCE" ]; then
  echo "guidance: none in repo - using generic review instructions" >&2
  GUIDANCE=$(cat <<'EOF'
This repo has no AGENTS.md or CLAUDE.md. Review the PR against the conventions you can infer from
the surrounding code: read the files the diff touches plus their siblings, and judge consistency,
correctness, and test coverage on that basis. Flag anything that duplicates or contradicts existing
code elsewhere in the repo.
EOF
)
fi

LOG="${REVIEW_LOG:-$HOME/.ai-skills-reviews/$NAME-$PR-$(date +%Y%m%d-%H%M%S).md}"
mkdir -p "$(dirname "$LOG")"

PROMPT=$(cat <<EOF
REPO: $SLUG
PR NUMBER: $PR
PR URL: $URL
BASE: $BASE
HEAD: $HEAD

$GUIDANCE

--- LOCAL RUN ---
You have no write access to GitHub. Print the review to stdout as markdown rather than posting it:
inline findings as \`path:line\` headings, then the summary.
First list the existing PR comments (gh api --method GET repos/$SLUG/issues/$PR/comments) and
re-check any still-open findings from earlier reviews instead of re-raising them.
Report the current state of the branch only - a finding already fixed, answered, or dismissed does
not come back, and there is no round-by-round log.
The tree you are in is the PR merged into current $BASE - the same tree CI reviews.
EOF
)

cd "$WT"
claude -p "$PROMPT" --model "${REVIEW_MODEL:-sonnet}" \
  --allowedTools "Read,Grep,Glob,Bash(git diff*),Bash(git log*),Bash(gh pr diff:$PR),Bash(gh pr view:$PR),Bash(gh api --method GET repos/$SLUG/issues/$PR/comments*)" \
  "$@" | tee "$LOG"

echo >&2
echo "saved: $LOG" >&2
