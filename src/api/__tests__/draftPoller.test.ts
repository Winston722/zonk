import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftPoller } from '../draftPoller'
import { sleeperApi } from '../sleeper'
import { mkPick } from '@/test/fixtures'

vi.mock('../sleeper', () => ({
  sleeperApi: { getPicks: vi.fn() },
}))

const getPicks = vi.mocked(sleeperApi.getPicks)

function flush() {
  // let pending promise callbacks run
  return new Promise((r) => setTimeout(r, 0))
}

describe('DraftPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    getPicks.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires the callback when the pick count changes, and not otherwise', async () => {
    const onPicksUpdate = vi.fn()
    getPicks.mockResolvedValue([mkPick()])
    const poller = new DraftPoller({ draftId: 'd', intervalMs: 1000, onPicksUpdate })

    poller.start()
    await flush()
    expect(onPicksUpdate).toHaveBeenCalledTimes(1)

    // Same count → no new callback
    await vi.advanceTimersByTimeAsync(1000)
    expect(onPicksUpdate).toHaveBeenCalledTimes(1)

    // New pick → callback fires again
    getPicks.mockResolvedValue([mkPick(), mkPick({ pick_no: 2 })])
    await vi.advanceTimersByTimeAsync(1000)
    expect(onPicksUpdate).toHaveBeenCalledTimes(2)

    poller.stop()
  })

  it('reports errors and keeps polling afterwards', async () => {
    const onPicksUpdate = vi.fn()
    const onError = vi.fn()
    getPicks.mockRejectedValueOnce(new Error('network down'))
    const poller = new DraftPoller({ draftId: 'd', intervalMs: 1000, onPicksUpdate, onError })

    poller.start()
    await flush()
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'network down' }))
    expect(onPicksUpdate).not.toHaveBeenCalled()

    // Recovers on the next tick
    getPicks.mockResolvedValue([mkPick()])
    await vi.advanceTimersByTimeAsync(1000)
    expect(onPicksUpdate).toHaveBeenCalledTimes(1)

    poller.stop()
  })

  it('treats a non-array response as an error instead of crashing', async () => {
    const onPicksUpdate = vi.fn()
    const onError = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPicks.mockResolvedValue(null as any)
    const poller = new DraftPoller({ draftId: 'd', intervalMs: 1000, onPicksUpdate, onError })

    poller.start()
    await flush()
    expect(onError).toHaveBeenCalled()
    expect(onPicksUpdate).not.toHaveBeenCalled()

    poller.stop()
  })

  it('stops cleanly and start() is idempotent', async () => {
    const onPicksUpdate = vi.fn()
    getPicks.mockResolvedValue([])
    const poller = new DraftPoller({ draftId: 'd', intervalMs: 1000, onPicksUpdate })

    poller.start()
    poller.start() // second start must not double the timers
    await flush()
    onPicksUpdate.mockClear()
    poller.stop()

    getPicks.mockResolvedValue([mkPick()])
    await vi.advanceTimersByTimeAsync(5000)
    expect(onPicksUpdate).not.toHaveBeenCalled()
  })
})
