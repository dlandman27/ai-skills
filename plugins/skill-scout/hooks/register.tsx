import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { SeenIdea, SkillIdea } from '../types'
import { draftPrompt, historyLine, isCorrection, normalizeSeen, parseIdea, scoutPrompt, seenEntry } from './idea'

const idea = atom({ plugin: 'skill-scout', key: 'idea' } as const, null)

// Right after a resume or /clear nothing has been sent yet, so there is no conversation to fork.
const NOTHING_TO_FORK = 'nothing-to-fork'
const WAITING_TEXT = 'Nothing sent in this session yet (just resumed or cleared). I will check after your next message.'

const SEEN_KEY = 'seen'
const HISTORY_KEY = 'history'
const MAX_SEEN = 200
const MAX_HISTORY = 30

async function readSeen($: EngineInterface): Promise<SeenIdea[]> {
  return normalizeSeen(await $.store.get(SEEN_KEY))
}

async function remember($: EngineInterface, found: SkillIdea): Promise<void> {
  const entry = seenEntry(found)
  const seen = (await readSeen($)).filter(one => one.key !== entry.key)
  await $.store.set(SEEN_KEY, [...seen, entry].slice(-MAX_SEEN))
}

async function readHistory($: EngineInterface): Promise<SkillIdea[]> {
  const saved = await $.store.get(HISTORY_KEY)
  return Array.isArray(saved) ? (saved as SkillIdea[]) : []
}

// Newest first, so `/skill-scout draft 1` is always the latest idea.
async function record($: EngineInterface, found: SkillIdea): Promise<void> {
  await $.store.set(HISTORY_KEY, [found, ...(await readHistory($))].slice(0, MAX_HISTORY))
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

// A second ask while a check runs waits for that one and shares its answer.
function check($: EngineInterface, threshold: number, correction: string | null): Promise<CheckOutcome> {
  if (running !== null) return running
  running = withProgress($, () => surface($, threshold, correction)).finally(() => {
    running = null
  })

  return running
}

async function describeStatus($: EngineInterface): Promise<string> {
  if (runningSince !== null) return `Checking, ${seconds((await $.clock.now()) - runningSince)} so far.`

  return lastOutcome === null ? 'Idle. No check has run in this session yet.' : `Idle. Last check: ${lastOutcome}`
}

// The banner above the prompt is the only signal; no toast, so a suggestion never interrupts.
async function surface($: EngineInterface, threshold: number, correction: string | null): Promise<CheckOutcome> {
  const reply = await $.model.fork({ prompt: scoutPrompt(await readSeen($), correction) })
  if (!reply.isAnswered && reply.reason === NOTHING_TO_FORK) return { text: WAITING_TEXT, isWaiting: true }
  if (!reply.isAnswered) return { text: `Check failed: ${reply.reason}.`, isWaiting: false }

  const found = parseIdea(reply.text)
  const isWorthIt = found !== null && found.confidence >= threshold
  if (!isWorthIt) return { text: `Nothing worth a skill here (${found?.confidence ?? 0}%).`, isWaiting: false }

  await remember($, found)
  await record($, found)
  await update($, idea, () => found)

  return { text: `Skill idea: ${headline(found)} (${found.confidence}%).`, isWaiting: false }
}

async function listHistory($: EngineInterface): Promise<string> {
  const history = await readHistory($)
  if (history.length === 0) return 'No skill ideas yet.'

  return [...history.map(historyLine), '', 'Draft one with /skill-scout draft <number>.'].join('\n')
}

async function draftFromHistory($: EngineInterface, number: number): Promise<string> {
  const chosen = (await readHistory($))[number - 1]
  if (!chosen) return `No idea #${number}. Run /skill-scout list to see them.`

  await $.prompt.submit({ text: draftPrompt(chosen) })
  return `Drafting ${headline(chosen)}.`
}

export const register: Register = (on, options) => {
  const threshold = Number(options.threshold)
  const minTools = Number(options.minTools)
  const everyTurns = Number(options.everyTurns)

  let tools = 0
  let workingTurnsSinceCheck = 0
  let correction: string | null = null
  let isCheckOwed = false

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'skill-scout',
      description: 'Check this conversation for a skill idea; `status` shows a running check, `list` past ideas, `draft <n>` drafts one',
    })

    return next(e)
  })

  on('command.run', { command: 'skill-scout' }, async ($, e) => {
    const [action = '', value = ''] = e.args.trim().split(/\s+/)
    if (action === 'list') return { text: await listHistory($) }
    if (action === 'status') return { text: await describeStatus($) }
    if (action === 'draft') return { text: await draftFromHistory($, Number(value) || 1) }

    const outcome = await check($, threshold, null)
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
      $.clock.after(0, () => void check($, threshold, pushback))
    }

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current: SkillIdea | null = await read($, idea)
    if (e.props.hasSurvey || current === null) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const dismiss = () => update($, idea, () => null)

    return (
      <Box flexDirection="column">
        <Text>
          <Text color="warning">{current.kind === 'edit' ? '✎ skill edit ' : '💡 new skill '}</Text>
          <Text bold>{current.kind === 'edit' ? `${current.skill} · ${current.name}` : current.name}</Text>
          <Text dimColor> · {current.confidence}%</Text>
        </Text>
        <Text dimColor wrap="truncate-end">
          {current.why}
        </Text>
        <Box gap={1}>
          <Button
            key="draft"
            label="Draft it"
            hotkey="d"
            variant="primary"
            onPress={async () => {
              await dismiss()
              await $.prompt.submit({ text: draftPrompt(current) })
            }}
          />
          <Button key="dismiss" label="Later" hotkey="x" role="dismiss" onPress={dismiss} />
        </Box>
      </Box>
    )
  })
}
