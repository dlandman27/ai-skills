import type { SeenIdea, SkillIdea } from '../types'

// Pushback anywhere in a prompt, not just its first word; polite openers like "no worries" are not pushback.
const CORRECTION =
  /^\s*(no|nope|stop|wrong)\b(?!\s+(worries|problem|rush|need|thanks))|\b(actually|that'?s (wrong|not (it|right|what))|not what i (meant|asked|said)|why did you|you should(n'?t)? have|i (said|told you|asked for)|instead of)\b/i

export function isCorrection(text: string): boolean {
  return CORRECTION.test(text)
}

export function seenKey(idea: SkillIdea): string {
  return idea.kind === 'edit' ? `edit:${idea.skill}:${idea.name}` : idea.name
}

export function seenEntry(idea: SkillIdea): SeenIdea {
  return { key: seenKey(idea), why: idea.why }
}

// Older saves kept bare keys; read them as entries with no reason.
export function normalizeSeen(saved: unknown): SeenIdea[] {
  if (!Array.isArray(saved)) return []

  return saved.flatMap(entry => {
    if (typeof entry === 'string') return [{ key: entry, why: '' }]
    const value = entry as Partial<SeenIdea> | null
    return typeof value?.key === 'string' ? [{ key: value.key, why: typeof value.why === 'string' ? value.why : '' }] : []
  })
}

export function scoutPrompt(seen: SeenIdea[], correction: string | null): string {
  const lines = seen.map(entry => `- ${entry.key}${entry.why ? `: ${entry.why}` : ''}`).join('\n')
  // The reasons, not just the slugs: the same idea under a new name is still the same idea.
  const skip = seen.length > 0 ? `\nAlready suggested or rejected. Never suggest these again, nor anything covering the same ground under another name:\n${lines}` : ''
  const pushback = correction ? `\nThe user just pushed back with: "${correction.slice(0, 300)}". If a skill should have prevented that, it is a strong "edit" candidate; if it was a one-off, ignore it.` : ''

  return `[skill-scout check, not from the user. Do not use tools. Answer with JSON only.]

Look back over this conversation for ONE way the user's skills could make this kind of work faster next time. Two kinds:

"new": a workflow done by hand that a new reusable skill would speed up — a multi-step sequence, a lookup re-derived, a recipe the user had to explain. No skill already in your available skills may cover it.

"edit": an existing skill (one in your available skills) fell short — the user corrected you on something it should have said, it was wrong or stale, you had to re-derive steps it should have encoded, or it should have triggered and didn't (its description missed). Name the skill exactly as listed.

Rules:
- It must be repeatable, not a one-off.
- Prefer "edit" over "new" when an existing skill is the natural home.
- Be strict. Most conversations have nothing worth suggesting; say so with confidence 0.
- confidence is how sure you are this would save real time, 0-100.${skip}${pushback}

Reply with exactly one JSON object:
{"kind": "new" | "edit", "confidence": 0-100, "name": "kebab-case slug for the idea", "skill": "existing skill name for edit, else empty", "why": "under 90 chars: what it would speed up or fix", "trigger": "when the skill should fire", "steps": ["what to add or change", "..."]}`
}

export function parseIdea(text: string): SkillIdea | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (match === null) return null

  let raw: unknown
  try {
    raw = JSON.parse(match[0])
  } catch {
    return null
  }
  if (typeof raw !== 'object' || raw === null) return null

  const value = raw as Record<string, unknown>
  const confidence = Number(value.confidence)
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const skill = typeof value.skill === 'string' ? value.skill.trim() : ''
  const kind = value.kind === 'edit' && skill !== '' ? 'edit' : 'new'
  if (!Number.isFinite(confidence) || name === '') return null

  return {
    kind,
    name,
    skill: kind === 'edit' ? skill : '',
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    why: typeof value.why === 'string' ? value.why : '',
    trigger: typeof value.trigger === 'string' ? value.trigger : '',
    steps: Array.isArray(value.steps) ? value.steps.filter((step): step is string => typeof step === 'string') : [],
  }
}

// Where skills live, and the process each home requires, so a draft never skips a home's own rules.
const HOMES = `Skill homes and their rules:
- Team (a shared plugin your team installs, its skills prefixed \`<plugin>:\`): edit the plugin's source repo, not the plugin cache; follow that plugin's own skill-writing skill if it has one (often writing-skills), including any check that the new wording actually changes behavior; land it as a PR.
- Public (a public skills marketplace repo, such as ai-skills): follow its add-skill skill, including the privacy check (no employer names, internal URLs or ticket ids) and the version bump.
- One repo only (that repo's .claude/skills): edit there and commit with the repo's own commit style.
- Personal (~/.claude/skills): use skill-creator.
- A plain fact rather than a procedure belongs in memory, not a skill.`

export function draftPrompt(idea: SkillIdea): string {
  const steps = idea.steps.map(step => `- ${step}`).join('\n')

  if (idea.kind === 'edit') {
    return `Edit the \`${idea.skill}\` skill.

Why: ${idea.why}
Trigger: ${idea.trigger}
What to add or change:
${steps}

${HOMES}

Work out which home \`${idea.skill}\` lives in and follow that home's rules. Find its source SKILL.md (never the plugin cache copy) and show me the proposed diff before writing. Base it on what actually happened in this conversation.`
  }

  return `Draft a new skill \`${idea.name}\` for my repertoire.

Why: ${idea.why}
Trigger: ${idea.trigger}
What it should encode:
${steps}

${HOMES}

Suggest the home that fits (general and shareable → public; team work → team; one repo → that repo; just for me → personal) and ask me to confirm before writing. Then follow that home's rules. Base it on what we actually did in this conversation.`
}

export function historyLine(idea: SkillIdea, index: number): string {
  const label = idea.kind === 'edit' ? `edit ${idea.skill}: ${idea.name}` : `new skill: ${idea.name}`
  return `${index + 1}. ${label} (${idea.confidence}%): ${idea.why}`
}
