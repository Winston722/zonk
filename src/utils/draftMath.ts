/**
 * Pick-order math for snake and linear drafts, including third-round reversal.
 * All pick numbers, rounds, and slots are 1-based.
 */

export interface DraftOrderInfo {
  teams: number
  rounds: number
  type: 'snake' | 'linear' | 'auction'
  /** Round at which snake direction reverses again (e.g. 3 for 3RR); 0/undefined = none */
  reversalRound?: number
}

export function roundForPick(pickNo: number, info: DraftOrderInfo): number {
  return Math.floor((pickNo - 1) / info.teams) + 1
}

/**
 * Which draft slot is on the clock for a given overall pick number.
 * Returns null for auction drafts (no fixed order).
 */
export function slotForPick(pickNo: number, info: DraftOrderInfo): number | null {
  if (info.type === 'auction') return null
  const round = roundForPick(pickNo, info)
  const idx = (pickNo - 1) % info.teams // 0-based position within the round

  if (info.type === 'linear') return idx + 1

  // Snake: odd rounds go forward, even rounds backward. With reversal (3RR),
  // parity flips for every round at or after the reversal round.
  let forward = round % 2 === 1
  if (info.reversalRound && info.reversalRound > 0 && round >= info.reversalRound) {
    forward = !forward
  }
  return forward ? idx + 1 : info.teams - idx
}

/**
 * The next overall pick number (>= fromPick) belonging to the given slot,
 * or null if that slot has no picks left (or the draft has no fixed order).
 */
export function nextPickForSlot(
  fromPick: number,
  slot: number,
  info: DraftOrderInfo,
): number | null {
  if (info.type === 'auction') return null
  const totalPicks = info.teams * info.rounds
  for (let p = Math.max(1, fromPick); p <= totalPicks; p++) {
    if (slotForPick(p, info) === slot) return p
  }
  return null
}
