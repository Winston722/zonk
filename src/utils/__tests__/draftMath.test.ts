import { describe, expect, it } from 'vitest'
import { nextPickForSlot, roundForPick, slotForPick, type DraftOrderInfo } from '../draftMath'

const snake: DraftOrderInfo = { teams: 4, rounds: 3, type: 'snake' }

describe('slotForPick', () => {
  it('goes forward in odd rounds and backward in even rounds for snake', () => {
    // Round 1: 1,2,3,4 — Round 2: 4,3,2,1 — Round 3: 1,2,3,4
    const order = Array.from({ length: 12 }, (_, i) => slotForPick(i + 1, snake))
    expect(order).toEqual([1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 4])
  })

  it('always goes forward for linear drafts', () => {
    const linear: DraftOrderInfo = { ...snake, type: 'linear' }
    const order = Array.from({ length: 8 }, (_, i) => slotForPick(i + 1, linear))
    expect(order).toEqual([1, 2, 3, 4, 1, 2, 3, 4])
  })

  it('handles third round reversal', () => {
    const trr: DraftOrderInfo = { ...snake, rounds: 4, reversalRound: 3 }
    // Rounds 1–2 snake normally (fwd, back); round 3 repeats backward; round 4 forward
    const order = Array.from({ length: 16 }, (_, i) => slotForPick(i + 1, trr))
    expect(order).toEqual([1, 2, 3, 4, 4, 3, 2, 1, 4, 3, 2, 1, 1, 2, 3, 4])
  })

  it('returns null for auctions', () => {
    expect(slotForPick(1, { ...snake, type: 'auction' })).toBeNull()
  })
})

describe('roundForPick', () => {
  it('computes 1-based rounds', () => {
    expect(roundForPick(1, snake)).toBe(1)
    expect(roundForPick(4, snake)).toBe(1)
    expect(roundForPick(5, snake)).toBe(2)
    expect(roundForPick(12, snake)).toBe(3)
  })
})

describe('nextPickForSlot', () => {
  it('finds the next pick for a slot including the current pick', () => {
    // Slot 1 picks at 1, 8, 9
    expect(nextPickForSlot(1, 1, snake)).toBe(1)
    expect(nextPickForSlot(2, 1, snake)).toBe(8)
    expect(nextPickForSlot(9, 1, snake)).toBe(9)
  })

  it('returns null when the slot has no picks left', () => {
    expect(nextPickForSlot(10, 1, snake)).toBeNull()
  })

  it('returns null for auctions', () => {
    expect(nextPickForSlot(1, 1, { ...snake, type: 'auction' })).toBeNull()
  })
})
