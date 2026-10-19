import { expect, mock, test } from 'claude-code/testing'

const NO_USAGE = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

test('right after a resume the check waits, then runs once the next turn is done', async ($, on) => {
  // Arrange
  mock.store(on)
  const clock = mock.clock(on)
  let forks = 0
  let canFork = false
  on('model.fork', async () => {
    forks += 1
    const value = canFork
      ? { isAnswered: true, text: '{"kind": "new", "confidence": 10, "name": "x"}', usage: NO_USAGE }
      : { isAnswered: false, reason: 'nothing-to-fork', usage: NO_USAGE }
    return { value } as never
  })
  on('turn.complete', async () => ({ text: 'done' }) as never)

  // Act
  const waiting = (await $.command.run({ command: 'skill-scout', args: '' } as never)) as { text?: string }
  canFork = true
  await $.turn.complete({ turnId: 't1', answer: 'done', durationMs: 1000, isAborted: false, reason: 'answer', category: null, explanation: null } as never)
  await clock.advance(10)

  // Assert
  expect(waiting.text).toContain('I will check after your next message')
  expect(forks).toBe(2)
})

test('asking again while a check runs waits for it instead of saying "already checking"', async ($, on) => {
  // Arrange
  mock.store(on)
  mock.clock(on)
  let forks = 0
  let finish: () => void = () => {}
  const gate = new Promise<void>(resolve => {
    finish = resolve
  })
  on('model.fork', async () => {
    forks += 1
    await gate
    return { value: { isAnswered: true, text: '{"kind": "new", "confidence": 5, "name": "x"}', usage: NO_USAGE } } as never
  })

  // Act
  const first = $.command.run({ command: 'skill-scout', args: '' } as never) as Promise<{ text?: string }>
  const second = $.command.run({ command: 'skill-scout', args: '' } as never) as Promise<{ text?: string }>
  finish()
  const answers = await Promise.all([first, second])

  // Assert
  expect(forks).toBe(1)
  expect(answers.map(answer => answer.text)).toEqual(['Nothing worth a skill here (5%, seen 0×).', 'Nothing worth a skill here (5%, seen 0×).'])
})

test('a running check shows its time in the status line and in /skill-scout status, then clears', async ($, on) => {
  // Arrange
  mock.store(on)
  const clock = mock.clock(on)
  const statuses: (string | undefined)[] = []
  on('ui.status', async (_$, e) => {
    statuses.push(e.text)
    return { value: undefined } as never
  })
  let finish: () => void = () => {}
  const gate = new Promise<void>(resolve => {
    finish = resolve
  })
  on('model.fork', async () => {
    await gate
    return { value: { isAnswered: true, text: '{"kind": "new", "confidence": 5, "name": "x"}', usage: NO_USAGE } } as never
  })
  const say = async (args: string) => ((await $.command.run({ command: 'skill-scout', args } as never)) as { text?: string }).text ?? ''

  // Act
  const checking = say('')
  await clock.advance(3000)
  const during = await say('status')
  finish()
  await checking
  const after = await say('status')

  // Assert
  expect(statuses[0]).toBe('🔎 skill-scout checking… 0s')
  expect(statuses).toContain('🔎 skill-scout checking… 3s')
  expect(statuses.at(-1)).toBeUndefined()
  expect(during.split('\n')[0]).toBe('Checking, 3s so far.')
  expect(after).toBe('Idle. Last check: Nothing worth a skill here (5%, seen 0×).\nCutoff 80% (default; 0 of 10 judged ideas needed to learn your own), and at least 2 real moments.')
})

test('weaker ideas with evidence are kept quietly, strong ones wait for your call, and your call is saved', async ($, on) => {
  // Arrange
  mock.store(on)
  mock.clock(on)
  const replies = [
    '{"kind": "new", "confidence": 60, "name": "weak-one", "why": "w", "evidence": ["a", "b"], "occurrences": 2}',
    '{"kind": "new", "confidence": 92, "name": "strong-one", "why": "s", "evidence": ["c", "d", "e"], "occurrences": 3}',
  ]
  on('model.fork', async () => ({ value: { isAnswered: true, text: replies.shift() ?? '{}', usage: NO_USAGE } }) as never)
  const say = async (args: string) => ((await $.command.run({ command: 'skill-scout', args } as never)) as { text?: string }).text ?? ''

  // Act
  const weak = await say('')
  const strong = await say('')
  const rejected = await say('reject 1')
  const list = await say('list')

  // Assert
  expect(weak).toBe('Below the 80% cutoff; kept quietly in /skill-scout list: new skill: weak-one (60%).')
  expect(strong).toBe('Skill idea: new skill: strong-one (92%, seen 3×).')
  expect(rejected).toBe('Marked new skill: strong-one not useful.')
  expect(list).toContain('1. ✗ new skill: strong-one (92%, seen 3×): s')
  expect(list).toContain('2. · new skill: weak-one (60%, seen 2×): w')
})
