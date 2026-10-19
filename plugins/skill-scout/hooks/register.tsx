import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { SeenIdea, SkillIdea } from '../types'
import { draftPrompt, historyLine, isCorrection, normalizeSeen, parseIdea, scoutPrompt, seenEntry } from './idea'

const idea = atom({ plugin: 'skill-scout', key: 'idea' } as const, null)
const isChecking = atom({ plugin: 'skill-scout', key: 'isChecking' } as const, false)

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

async function check($: EngineInterface, threshold: number, correction: string | null): Promise<string> {
  if (await read($, isChecking)) return 'Already checking.'
  await update($, isChecking, () => true)

  try {
    return await surface($, threshold, correction)
  } finally {
    await update($, isChecking, () => false)
  }
}

// The banner above the prompt is the only signal; no toast, so a suggestion never interrupts.
async function surface($: EngineInterface, threshold: number, correction: string | null): Promise<string> {
  const reply = await $.model.fork({ prompt: scoutPrompt(await readSeen($), correction) })
  if (!reply.isAnswered) return `Check failed: ${reply.reason}.`

  const found = parseIdea(reply.text)
  const isWorthIt = found !== null && found.confidence >= threshold
  if (!isWorthIt) return `Nothing worth a skill here (${found?.confidence ?? 0}%).`

  await remember($, found)
  await record($, found)
  await update($, idea, () => found)

  return `Skill idea: ${headline(found)} (${found.confidence}%).`
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

  on('session.start', async ($, e, next) => {
    await update($, isChecking, () => false)
    await $.command.register({
      name: 'skill-scout',
      description: 'Check this conversation for a skill idea; `list` shows past ideas, `draft <n>` drafts one',
    })

    return next(e)
  })

  on('command.run', { command: 'skill-scout' }, async ($, e) => {
    const [action = '', value = ''] = e.args.trim().split(/\s+/)
    if (action === 'list') return { text: await listHistory($) }
    if (action === 'draft') return { text: await draftFromHistory($, Number(value) || 1) }

    return { text: await check($, threshold, null) }
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
    const isDue = isBusyTurn || correction !== null || workingTurnsSinceCheck >= everyTurns
    const pushback = correction
    tools = 0
    correction = null
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
