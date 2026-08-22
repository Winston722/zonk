import { describe, expect, it } from 'vitest'
import { applyPicksToRankings, matchRankingsToSleeper } from '../playerMatcher'
import { normaliseName } from '../csvParser'
import type { RankedPlayer } from '@/types/player'
import type { SleeperPlayersMap } from '@/types/sleeper'

function mkPlayer(overrides: Partial<RankedPlayer> & { name: string }): RankedPlayer {
  return {
    rank: 1,
    normalisedName: normaliseName(overrides.name),
    position: '',
    team: '',
    sleeperId: null,
    isDrafted: false,
    pickNumber: null,
    round: null,
    draftedBy: null,
    age: null,
    yearsExp: null,
    ppg: null,
    availabilityScore: null,
    riskCv: null,
    dcfValue: null,
    replacementValue: null,
    var: null,
    ...overrides,
  }
}

const sleeperPlayers: SleeperPlayersMap = {
  '1001': {
    player_id: '1001',
    first_name: 'Josh',
    last_name: 'Allen',
    full_name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    status: null,
    age: 30,
    years_exp: 7,
    injury_status: null,
  },
  '1002': {
    player_id: '1002',
    first_name: 'Josh',
    last_name: 'Allen',
    full_name: 'Josh Allen',
    position: 'LB',
    team: 'ARI',
    status: null,
    age: 28,
    years_exp: 6,
    injury_status: null,
  },
  '1003': {
    player_id: '1003',
    first_name: 'Bijan',
    last_name: 'Robinson',
    full_name: 'Bijan Robinson',
    position: 'RB',
    team: 'ATL',
    status: null,
    age: 24,
    years_exp: 2,
    injury_status: null,
  },
}

describe('matchRankingsToSleeper', () => {
  it('prefers an exact name + position match (disambiguates the two Josh Allens)', () => {
    const [qb] = matchRankingsToSleeper([mkPlayer({ name: 'Josh Allen', position: 'QB' })], sleeperPlayers)
    const [lb] = matchRankingsToSleeper([mkPlayer({ name: 'Josh Allen', position: 'LB' })], sleeperPlayers)
    expect(qb.sleeperId).toBe('1001')
    expect(lb.sleeperId).toBe('1002')
  })

  it('falls back to name-only when the position differs', () => {
    const [p] = matchRankingsToSleeper(
      [mkPlayer({ name: 'Bijan Robinson', position: 'FLEX' })],
      sleeperPlayers,
    )
    expect(p.sleeperId).toBe('1003')
  })

  it('falls back to last name + position', () => {
    const [p] = matchRankingsToSleeper(
      [mkPlayer({ name: 'B. Robinson', position: 'RB' })],
      sleeperPlayers,
    )
    expect(p.sleeperId).toBe('1003')
  })

  it('backfills team and age from Sleeper data', () => {
    const [p] = matchRankingsToSleeper(
      [mkPlayer({ name: 'Bijan Robinson', position: 'RB' })],
      sleeperPlayers,
    )
    expect(p.team).toBe('ATL')
    expect(p.age).toBe(24)
    expect(p.yearsExp).toBe(2)
  })

  it('leaves unmatched players untouched', () => {
    const [p] = matchRankingsToSleeper(
      [mkPlayer({ name: 'Nobody Nowhere', position: 'QB' })],
      sleeperPlayers,
    )
    expect(p.sleeperId).toBeNull()
  })
})

describe('applyPicksToRankings', () => {
  const rankings = [
    mkPlayer({ name: 'Josh Allen', position: 'QB', sleeperId: '1001' }),
    mkPlayer({ name: 'Bijan Robinson', position: 'RB', sleeperId: null }),
  ]

  it('marks players drafted by sleeper id', () => {
    const picks = [
      {
        player_id: '1001',
        pick_no: 1,
        round: 1,
        draft_slot: 1,
        metadata: { first_name: 'Josh', last_name: 'Allen' },
        picked_by: 'user_a',
      },
    ]
    const [allen, bijan] = applyPicksToRankings(rankings, picks, { user_a: 'Team Winston' })
    expect(allen.isDrafted).toBe(true)
    expect(allen.pickNumber).toBe(1)
    expect(allen.draftedBy).toBe('Team Winston')
    expect(bijan.isDrafted).toBe(false)
  })

  it('falls back to name matching when no sleeper id is set', () => {
    const picks = [
      {
        player_id: '9999',
        pick_no: 2,
        round: 1,
        draft_slot: 2,
        metadata: { first_name: 'Bijan', last_name: 'Robinson' },
        picked_by: 'user_b',
      },
    ]
    const [, bijan] = applyPicksToRankings(rankings, picks, {})
    expect(bijan.isDrafted).toBe(true)
    expect(bijan.pickNumber).toBe(2)
  })

  it('labels unknown managers by draft slot', () => {
    const picks = [
      {
        player_id: '1001',
        pick_no: 1,
        round: 1,
        draft_slot: 5,
        metadata: { first_name: 'Josh', last_name: 'Allen' },
        picked_by: '',
      },
    ]
    const [allen] = applyPicksToRankings(rankings, picks, {})
    expect(allen.draftedBy).toBe('Slot 5')
  })

  it('does not crash on picks with missing metadata', () => {
    const picks = [
      { player_id: '1001', pick_no: 1, round: 1, draft_slot: 1, picked_by: 'user_a' },
    ]
    expect(() => applyPicksToRankings(rankings, picks, {})).not.toThrow()
    const [allen] = applyPicksToRankings(rankings, picks, {})
    expect(allen.isDrafted).toBe(true) // still matched via sleeper id
  })

  it('clears drafted state for players no longer in the pick list', () => {
    const drafted = rankings.map((p) => ({ ...p, isDrafted: true, pickNumber: 3 }))
    const [allen] = applyPicksToRankings(drafted, [], {})
    expect(allen.isDrafted).toBe(false)
    expect(allen.pickNumber).toBeNull()
  })
})
