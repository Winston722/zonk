import type { SleeperDraft, SleeperLeague, SleeperUser } from './sleeper'

export interface DraftSession {
  user: SleeperUser
  league: SleeperLeague
  draft: SleeperDraft
}

export interface SetupState {
  step: 'username' | 'league' | 'draft' | 'rankings'
}

export type PositionFilter = 'ALL' | 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'DL' | 'LB' | 'DB'

/** Positions that count as FLEX in dynasty IDP */
export const FLEX_POSITIONS = new Set(['RB', 'WR', 'TE'])

export interface FilterState {
  position: PositionFilter
  showDrafted: boolean
  searchQuery: string
}
