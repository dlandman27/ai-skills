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
  expect(answers.map(answer => answer.text)).toEqual(['Nothing worth a skill here (5%).', 'Nothing worth a skill here (5%).'])
})
