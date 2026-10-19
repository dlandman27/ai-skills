import { expect, test } from 'claude-code/testing'

import { draftPrompt, historyLine, isCorrection, normalizeSeen, parseIdea, scoutPrompt, seenEntry, seenKey } from './idea'

const BASE = { confidence: 90, why: 'faster mod persistence', trigger: 't', steps: ['s1'] }

test('parses a new-skill idea out of a chatty reply and clamps confidence', async () => {
  // Arrange
  const reply = 'Sure:\n{"kind": "new", "confidence": 140, "name": "cut-release", "skill": "x", "why": "faster", "trigger": "release", "steps": ["a", 3]}'

  // Act
  const found = parseIdea(reply)

  // Assert
  expect(found).toEqual({ kind: 'new', name: 'cut-release', skill: '', confidence: 100, why: 'faster', trigger: 'release', steps: ['a'] })
})

test('parses an edit idea and falls back to new when the skill is missing', async () => {
  // Arrange
  const edit = '{"kind": "edit", "confidence": 85, "name": "import-order", "skill": "mobile", "why": "w", "trigger": "t", "steps": []}'
  const skillless = '{"kind": "edit", "confidence": 85, "name": "import-order", "skill": "", "why": "w", "trigger": "t", "steps": []}'

  // Act
  const found = parseIdea(edit)
  const fallback = parseIdea(skillless)

  // Assert
  expect(found?.kind).toBe('edit')
  expect(found?.skill).toBe('mobile')
  expect(fallback?.kind).toBe('new')
})

test('rejects replies with no name or no JSON', async () => {
  // Arrange
  const nameless = '{"confidence": 0}'
  const prose = 'nothing to suggest'

  // Act
  const results = [parseIdea(nameless), parseIdea(prose), parseIdea('{broken')]

  // Assert
  expect(results).toEqual([null, null, null])
})

test('seen keys keep edits to different skills apart', async () => {
  // Act
  const keys = [seenKey({ ...BASE, kind: 'new', name: 'a', skill: '' }), seenKey({ ...BASE, kind: 'edit', name: 'a', skill: 'mobile' })]

  // Assert
  expect(keys).toEqual(['a', 'edit:mobile:a'])
})

test('spots pushback anywhere in a prompt, but not polite openers', async () => {
  // Arrange
  const prompts = [
    "no, don't do that",
    'Actually use yarn',
    "hmm that's wrong, it lives in the libs folder",
    'I said private, not public',
    'add a button',
    'nothing changed?',
    'No worries, ship it',
    "Don't forget the tests",
  ]

  // Act
  const flags = prompts.map(isCorrection)

  // Assert
  expect(flags).toEqual([true, true, true, true, false, false, false, false])
})

test('the scout sees past ideas with their reasons, and the pushback that triggered it', async () => {
  // Arrange
  const seen = [seenEntry({ ...BASE, kind: 'new', name: 'mod-state-store', skill: '' })]

  // Act
  const scout = scoutPrompt(seen, "that's wrong, check the store first")
  const quiet = scoutPrompt([], null)

  // Assert
  expect(scout).toContain('- mod-state-store: faster mod persistence')
  expect(scout).toContain('nor anything covering the same ground under another name')
  expect(scout).toContain('"that\'s wrong, check the store first"')
  expect(quiet).not.toContain('pushed back')
})

test('older saves of bare keys still read as seen ideas', async () => {
  // Act
  const seen = normalizeSeen(['cut-release', { key: 'edit:mobile:x', why: 'w' }, 7, null])

  // Assert
  expect(seen).toEqual([
    { key: 'cut-release', why: '' },
    { key: 'edit:mobile:x', why: 'w' },
  ])
})

test('drafts name every skill home and its own process', async () => {
  // Act
  const draftNew = draftPrompt({ ...BASE, kind: 'new', name: 'x-y', skill: '' })
  const draftEdit = draftPrompt({ ...BASE, kind: 'edit', name: 'x-y', skill: 'team:mobile' })

  // Assert
  expect(draftNew).toContain('`x-y`')
  expect(draftNew).toContain('ask me to confirm before writing')
  expect(draftEdit).toContain('Edit the `team:mobile` skill')
  expect(draftEdit).toContain('- s1')
  for (const draft of [draftNew, draftEdit]) {
    expect(draft).toContain('writing-skills')
    expect(draft).toContain('add-skill')
    expect(draft).toContain('privacy check')
    expect(draft).toContain('skill-creator')
  }
})

test('history lines are numbered for drafting later', async () => {
  // Act
  const line = historyLine({ ...BASE, kind: 'edit', name: 'import-order', skill: 'mobile' }, 0)

  // Assert
  expect(line).toBe('1. edit mobile: import-order (90%): faster mod persistence')
})
