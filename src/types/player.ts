// Application-level player model, merging custom rankings with Sleeper data

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | 'FLEX' | 'DL' | 'LB' | 'DB'

export interface RankedPlayer {
  /** Rank derived from Value Above Replacement (1 = highest VAR) */
  rank: number
  /** User-visible name from the rankings file */
  name: string
  /** Normalised name used for fuzzy matching */
  normalisedName: string
  position: Position | string
  team: string
  /** Sleeper player_id once matched; null if unmatched */
  sleeperId: string | null
  /** True when this player appears in draft picks */
  isDrafted: boolean
  /** The pick number when taken, or null */
  pickNumber: number | null
  /** Which round they were taken */
  round: number | null
  /** Display name of the team/manager that picked them */
  draftedBy: string | null

  // --- Custom ranking metrics ---
  age: number | null
  yearsExp: number | null
  ppg: number | null
  availabilityScore: number | null
  riskCv: number | null
  dcfValue: number | null
  replacementValue: number | null
  /** Value Above Replacement — primary sort key */
  var: number | null
}

export interface DraftPick {
  pickNumber: number
  round: number
  sleeperId: string
  playerName: string
  position: string
  team: string
  draftedBy: string
}
