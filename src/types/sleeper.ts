// Raw shapes returned by the Sleeper REST API

export interface SleeperUser {
  user_id: string
  username: string
  display_name: string
  avatar: string | null
}

export interface SleeperLeague {
  league_id: string
  name: string
  season: string
  sport: string
  total_rosters: number
  status: 'pre_draft' | 'drafting' | 'in_season' | 'complete' | 'post_season'
  draft_id: string
  settings: {
    num_teams: number
    draft_rounds: number
  }
  roster_positions: string[]
}

export interface SleeperDraft {
  draft_id: string
  league_id: string
  type: 'snake' | 'linear' | 'auction'
  status: 'pre_draft' | 'drafting' | 'complete' | 'paused'
  season: string
  season_type: string
  sport: string
  start_time: number | null
  settings: {
    teams: number
    rounds: number
    pick_timer: number
    slots_wr: number
    slots_rb: number
    slots_qb: number
    slots_te: number
    slots_k: number
    slots_def: number
    slots_flex: number
    slots_super_flex: number
  }
  draft_order: Record<string, number> | null
  slot_to_roster_id: Record<string, number> | null
  metadata: {
    scoring_type?: string
    name?: string
    description?: string
  }
}

export interface SleeperPick {
  round: number
  roster_id: number
  player_id: string
  picked_by: string
  pick_no: number
  draft_slot: number
  metadata: {
    first_name: string
    last_name: string
    position: string
    team: string
    number?: string
    years_exp?: string
  }
  is_keeper: boolean | null
}

export interface SleeperPlayer {
  player_id: string
  first_name: string
  last_name: string
  full_name?: string
  position: string
  team: string | null
  status: string | null
  age: number | null
  years_exp: number | null
  injury_status: string | null
}

export type SleeperPlayersMap = Record<string, SleeperPlayer>
