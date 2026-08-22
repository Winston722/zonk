import type { RankedPlayer } from '@/types/player'
import type { SleeperDraft, SleeperPick, SleeperUser } from '@/types/sleeper'
import { normaliseName } from '@/utils/csvParser'

export function mkRanked(overrides: Partial<RankedPlayer> & { name: string }): RankedPlayer {
  return {
    rank: 1,
    normalisedName: normaliseName(overrides.name),
    position: 'RB',
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

export function mkDraft(overrides: Partial<SleeperDraft> = {}): SleeperDraft {
  return {
    draft_id: 'draft123',
    league_id: 'league123',
    type: 'snake',
    status: 'drafting',
    season: '2026',
    season_type: 'regular',
    sport: 'nfl',
    start_time: null,
    settings: {
      teams: 4,
      rounds: 3,
      pick_timer: 120,
      slots_wr: 2,
      slots_rb: 2,
      slots_qb: 1,
      slots_te: 1,
      slots_k: 1,
      slots_def: 1,
      slots_flex: 1,
      slots_super_flex: 0,
      ...overrides.settings,
    },
    draft_order: { user_me: 1, user_b: 2, user_c: 3, user_d: 4 },
    slot_to_roster_id: null,
    metadata: { name: 'Test Draft' },
    ...overrides,
  }
}

export function mkPick(overrides: Partial<SleeperPick> = {}): SleeperPick {
  return {
    round: 1,
    roster_id: 1,
    player_id: '1001',
    picked_by: 'user_b',
    pick_no: 1,
    draft_slot: 2,
    metadata: {
      first_name: 'Bijan',
      last_name: 'Robinson',
      position: 'RB',
      team: 'ATL',
    },
    is_keeper: null,
    ...overrides,
  }
}

export function mkUser(overrides: Partial<SleeperUser> = {}): SleeperUser {
  return {
    user_id: 'user_me',
    username: 'winston',
    display_name: 'Winston',
    avatar: null,
    ...overrides,
  }
}
