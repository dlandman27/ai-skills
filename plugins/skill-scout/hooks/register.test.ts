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
