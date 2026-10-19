import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { IdeaOutcome, ScoutedIdea, SeenIdea, SkillIdea } from '../types'
import {
  draftPrompt,
  hasEnoughEvidence,
  historyLine,
  isCorrection,
  learnThreshold,
  MIN_JUDGED,
  normalizeSeen,
  parseIdea,
  scoutPrompt,
  seenEntry,
} from './idea'

const idea = atom({ plugin: 'skill-scout', key: 'idea' } as const, null)

// Right after a resume or /clear nothing has been sent yet, so there is no conversation to fork.
const NOTHING_TO_FORK = 'nothing-to-fork'
const WAITING_TEXT = 'Nothing sent in this session yet (just resumed or cleared). I will check after your next message.'

const SEEN_KEY = 'seen'
const HISTORY_KEY = 'history'
const MAX_SEEN = 200
const MAX_HISTORY = 60

// Ideas this strong but under the cutoff are kept quietly, so calibration can learn to lower the cutoff too.
const QUIET_FLOOR = 40

async function readSeen($: EngineInterface): Promise<SeenIdea[]> {
  return normalizeSeen(await $.store.get(SEEN_KEY))
}

async function remember($: EngineInterface, found: SkillIdea): Promise<void> {
  const entry = seenEntry(found)
  const seen = (await readSeen($)).filter(one => one.key !== entry.key)
  await $.store.set(SEEN_KEY, [...seen, entry].slice(-MAX_SEEN))
}

// Older saves held bare ideas with no id, outcome or evidence; read them as still waiting.
async function readHistory($: EngineInterface): Promise<ScoutedIdea[]> {
  const saved = await $.store.get(HISTORY_KEY)
  if (!Array.isArray(saved)) return []

  return (saved as Partial<ScoutedIdea>[]).map((one, index) => ({
    ...(one as SkillIdea),
    id: one.id ?? `saved-${index}`,
    outcome: one.outcome ?? 'pending',
    evidence: one.evidence ?? [],
    occurrences: one.occurrences ?? 0,
  }))
}

// Newest first, so `/skill-scout draft 1` is always the latest idea.
async function record($: EngineInterface, found: ScoutedIdea): Promise<void> {
  await $.store.set(HISTORY_KEY, [found, ...(await readHistory($))].slice(0, MAX_HISTORY))
}

async function judge($: EngineInterface, id: string, outcome: IdeaOutcome): Promise<void> {
  const history = await readHistory($)
  await $.store.set(HISTORY_KEY, history.map(one => (one.id === id ? { ...one, outcome } : one)))
}

function headline(found: SkillIdea): string {
  return found.kind === 'edit' ? `edit ${found.skill}: ${found.name}` : `new skill: ${found.name}`
}

type CheckOutcome = { text: string; isWaiting: boolean }

// The check in flight, held by this module rather than session state: a reload or a check cut short
// drops it with the module, so nothing is left stuck "checking".
let running: Promise<CheckOutcome> | null = null

let runningSince: number | null = null
let lastOutcome: string | null = null

const PROGRESS_TICK_MS = 1000

const seconds = (ms: number) => `${Math.round(ms / 1000)}s`

// A check is one long model call with no steps to report, so the status line shows that it runs and for how long.
async function withProgress($: EngineInterface, work: () => Promise<CheckOutcome>): Promise<CheckOutcome> {
  const startedAt = await $.clock.now()
  runningSince = startedAt
  const show = async () => $.ui.status(`🔎 skill-scout checking… ${seconds((await $.clock.now()) - startedAt)}`)
  await show()
  const ticker = $.clock.every(PROGRESS_TICK_MS, () => void show())

  try {
    const outcome = await work()
    lastOutcome = outcome.text
    return outcome
  } finally {
    ticker.cancel()
    runningSince = null
    $.ui.status(undefined)
  }
}

type Gates = { threshold: number; minEvidence: number }

// A second ask while a check runs waits for that one and shares its answer.
function check($: EngineInterface, gates: Gates, correction: string | null): Promise<CheckOutcome> {
  if (running !== null) return running
  running = withProgress($, () => surface($, gates, correction)).finally(() => {
    running = null
  })

  return running
}

async function describeCutoff($: EngineInterface, gates: Gates): Promise<string> {
  const learned = learnThreshold(await readHistory($), gates.threshold)
  const source =
    learned.judged >= MIN_JUDGED
      ? `learned from ${learned.judged} ideas you judged`
      : `default; ${learned.judged} of ${MIN_JUDGED} judged ideas needed to learn your own`

  return `Cutoff ${learned.threshold}% (${source}), and at least ${gates.minEvidence} real moments.`
}

async function describeStatus($: EngineInterface, gates: Gates): Promise<string> {
  const now = runningSince !== null ? `Checking, ${seconds((await $.clock.now()) - runningSince)} so far.` : null
  const idle = lastOutcome === null ? 'Idle. No check has run in this session yet.' : `Idle. Last check: ${lastOutcome}`

  return `${now ?? idle}\n${await describeCutoff($, gates)}`
}

// Evidence first, then the cutoff learned from your own calls. The banner is the only signal; no toast.
async function surface($: EngineInterface, gates: Gates, correction: string | null): Promise<CheckOutcome> {
  const reply = await $.model.fork({ prompt: scoutPrompt(await readSeen($), correction) })
  if (!reply.isAnswered && reply.reason === NOTHING_TO_FORK) return { text: WAITING_TEXT, isWaiting: true }
  if (!reply.isAnswered) return { text: `Check failed: ${reply.reason}.`, isWaiting: false }

  const found = parseIdea(reply.text)
  if (found === null || !hasEnoughEvidence(found, gates.minEvidence)) {
    const seen = found === null ? '' : `, seen ${found.occurrences}×`
    return { text: `Nothing worth a skill here (${found?.confidence ?? 0}%${seen}).`, isWaiting: false }
  }

  const { threshold } = learnThreshold(await readHistory($), gates.threshold)
  const isStrong = found.confidence >= threshold
  if (!isStrong && found.confidence < QUIET_FLOOR) return { text: `Nothing worth a skill here (${found.confidence}%).`, isWaiting: false }

  const scouted: ScoutedIdea = { ...found, id: `${await $.clock.now()}-${found.name}`, outcome: isStrong ? 'pending' : 'quiet' }
  await remember($, scouted)
  await record($, scouted)
  if (!isStrong) return { text: `Below the ${threshold}% cutoff; kept quietly in /skill-scout list: ${headline(found)} (${found.confidence}%).`, isWaiting: false }

  await update($, idea, () => scouted)
  return { text: `Skill idea: ${headline(found)} (${found.confidence}%, seen ${found.occurrences}×).`, isWaiting: false }
}

async function listHistory($: EngineInterface): Promise<string> {
  const history = await readHistory($)
  if (history.length === 0) return 'No skill ideas yet.'

  return [
    ...history.map(historyLine),
    '',
    '• waiting  ✓ drafted  ✗ not useful  · kept quietly below the cutoff',
    'Draft one with /skill-scout draft <number>, or mark one not useful with /skill-scout reject <number>.',
  ].join('\n')
}

async function draftFromHistory($: EngineInterface, number: number): Promise<string> {
  const chosen = (await readHistory($))[number - 1]
  if (!chosen) return `No idea #${number}. Run /skill-scout list to see them.`

  await judge($, chosen.id, 'drafted')
  await $.prompt.submit({ text: draftPrompt(chosen) })
  return `Drafting ${headline(chosen)}.`
}

async function rejectFromHistory($: EngineInterface, number: number): Promise<string> {
  const chosen = (await readHistory($))[number - 1]
  if (!chosen) return `No idea #${number}. Run /skill-scout list to see them.`

  await judge($, chosen.id, 'rejected')
  return `Marked ${headline(chosen)} not useful.`
}

export const register: Register = (on, options) => {
  const gates: Gates = { threshold: Number(options.threshold), minEvidence: Number(options.minEvidence) }
  const minTools = Number(options.minTools)
  const everyTurns = Number(options.everyTurns)

  let tools = 0
  let workingTurnsSinceCheck = 0
  let correction: string | null = null
  let isCheckOwed = false

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'skill-scout',
      description: 'Check this conversation for a skill idea; `status`, `list`, `draft <n>`, `reject <n>`',
    })

    return next(e)
  })

  on('command.run', { command: 'skill-scout' }, async ($, e) => {
    const [action = '', value = ''] = e.args.trim().split(/\s+/)
    if (action === 'list') return { text: await listHistory($) }
    if (action === 'status') return { text: await describeStatus($, gates) }
    if (action === 'draft') return { text: await draftFromHistory($, Number(value) || 1) }
    if (action === 'reject') return { text: await rejectFromHistory($, Number(value) || 1) }

    const outcome = await check($, gates, null)
    if (outcome.isWaiting) isCheckOwed = true

    return { text: outcome.text }
  })

  on('prompt.submit', ($, e, next) => {
    if (isCorrection(e.text)) correction = e.text

    return next(e)
  })

  on('tool.call', ($, e, next) => {
    if (e.agentId === undefined) tools += 1

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined || e.reason !== 'answer') return result

    // Only turns that did work count toward the periodic check, so a quiet chat costs nothing.
    if (tools > 0) workingTurnsSinceCheck += 1
    const isBusyTurn = tools >= minTools
    const isDue = isCheckOwed || isBusyTurn || correction !== null || workingTurnsSinceCheck >= everyTurns
    const pushback = correction
    tools = 0
    correction = null
    isCheckOwed = false
    if (isDue) {
      workingTurnsSinceCheck = 0
      $.clock.after(0, () => void check($, gates, pushback))
    }

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current: ScoutedIdea | null = await read($, idea)
    if (e.props.hasSurvey || current === null) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const close = () => update($, idea, () => null)
    // Your call on each idea is what calibration learns from; "Later" leaves it undecided.
    const decide = async (outcome: IdeaOutcome) => {
      await close()
      await judge($, current.id, outcome)
    }

    return (
      <Box flexDirection="column">
        <Text>
          <Text color="warning">{current.kind === 'edit' ? '✎ skill edit ' : '💡 new skill '}</Text>
          <Text bold>{current.kind === 'edit' ? `${current.skill} · ${current.name}` : current.name}</Text>
          <Text dimColor>
            {' '}
            · {current.confidence}% · seen {current.occurrences}×
          </Text>
        </Text>
        <Text dimColor wrap="truncate-end">
          {current.why}
        </Text>
        {current.evidence.slice(0, 2).map(moment => (
          <Text dimColor wrap="truncate-end">
            {'  “'}
            {moment}
            {'”'}
          </Text>
        ))}
        <Box gap={1}>
          <Button
            key="draft"
            label="Draft it"
            hotkey="d"
            variant="primary"
            onPress={async () => {
              await decide('drafted')
              await $.prompt.submit({ text: draftPrompt(current) })
            }}
          />
          <Button key="reject" label="Not useful" hotkey="n" onPress={() => decide('rejected')} />
          <Button key="dismiss" label="Later" hotkey="x" role="dismiss" onPress={close} />
        </Box>
      </Box>
    )
  })
}
