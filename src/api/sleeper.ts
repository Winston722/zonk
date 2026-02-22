import type {
  SleeperUser,
  SleeperLeague,
  SleeperDraft,
  SleeperPick,
  SleeperPlayersMap,
} from '@/types/sleeper'

const BASE_URL = 'https://api.sleeper.app/v1'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Sleeper API error ${res.status} for ${path}`)
  }
  return res.json() as Promise<T>
}

export const sleeperApi = {
  getUserByUsername(username: string): Promise<SleeperUser> {
    return get<SleeperUser>(`/user/${encodeURIComponent(username)}`)
  },

  getLeaguesForUser(userId: string, season: string): Promise<SleeperLeague[]> {
    return get<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`)
  },

  getDraft(draftId: string): Promise<SleeperDraft> {
    return get<SleeperDraft>(`/draft/${draftId}`)
  },

  getDraftsForLeague(leagueId: string): Promise<SleeperDraft[]> {
    return get<SleeperDraft[]>(`/league/${leagueId}/drafts`)
  },

  getDraftsForUser(userId: string, season: string): Promise<SleeperDraft[]> {
    return get<SleeperDraft[]>(`/user/${userId}/drafts/nfl/${season}`)
  },

  getPicks(draftId: string): Promise<SleeperPick[]> {
    return get<SleeperPick[]>(`/draft/${draftId}/picks`)
  },

  /**
   * Returns all NFL players as a map keyed by player_id.
   * This is a large payload (~7 MB). Cache it locally after first fetch.
   */
  getAllPlayers(): Promise<SleeperPlayersMap> {
    return get<SleeperPlayersMap>('/players/nfl')
  },
}
