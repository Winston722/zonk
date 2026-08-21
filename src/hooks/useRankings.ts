import { useState } from 'react'
import { parseCsvRankings } from '@/utils/csvParser'
import { matchRankingsToSleeper } from '@/utils/playerMatcher'
import { sleeperApi } from '@/api/sleeper'
import { useDraftStore } from '@/store/draftStore'
import type { RankedPlayer } from '@/types/player'
import type { SleeperPlayersMap } from '@/types/sleeper'

const PLAYERS_CACHE_KEY = 'zonk_sleeper_players_cache'
const PLAYERS_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CachedPlayers {
  timestamp: number
  data: SleeperPlayersMap
}

/**
 * Keep only the fields matching needs. The raw /players/nfl payload is ~10 MB,
 * which blows the ~5 MB localStorage quota; the slimmed map fits comfortably.
 */
function slimPlayers(players: SleeperPlayersMap): SleeperPlayersMap {
  const slim: SleeperPlayersMap = {}
  for (const [id, p] of Object.entries(players)) {
    if (!p.position || !(p.full_name ?? p.first_name)) continue
    slim[id] = {
      player_id: id,
      first_name: p.first_name,
      last_name: p.last_name,
      full_name: p.full_name,
      position: p.position,
      team: p.team ?? null,
      status: null,
      age: p.age ?? null,
      years_exp: p.years_exp ?? null,
      injury_status: null,
    }
  }
  return slim
}

async function getCachedOrFetchPlayers(): Promise<SleeperPlayersMap> {
  try {
    const raw = localStorage.getItem(PLAYERS_CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as CachedPlayers
      if (Date.now() - cached.timestamp < PLAYERS_CACHE_TTL_MS) {
        return cached.data
      }
    }
  } catch {
    // ignore cache errors
  }

  const players = slimPlayers(await sleeperApi.getAllPlayers())
  try {
    localStorage.setItem(
      PLAYERS_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data: players }),
    )
  } catch {
    // storage may be full; ignore
  }
  return players
}

export function useRankings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unmatchedCount, setUnmatchedCount] = useState(0)
  const store = useDraftStore()

  async function loadFromFile(file: File) {
    setLoading(true)
    setError(null)
    try {
      const parsed = await parseCsvRankings(file)
      await applySleeperMatching(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse rankings')
    } finally {
      setLoading(false)
    }
  }

  async function loadFromUrl(url: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch rankings (${res.status})`)
      const text = await res.text()
      const parsed = await parseCsvRankings(text)
      await applySleeperMatching(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rankings')
    } finally {
      setLoading(false)
    }
  }

  async function loadFromText(csvText: string) {
    setLoading(true)
    setError(null)
    try {
      const parsed = await parseCsvRankings(csvText)
      await applySleeperMatching(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse rankings')
    } finally {
      setLoading(false)
    }
  }

  async function applySleeperMatching(parsed: RankedPlayer[]) {
    const players = await getCachedOrFetchPlayers()
    const matched = matchRankingsToSleeper(parsed, players)
    const unmatched = matched.filter((p) => !p.sleeperId).length
    setUnmatchedCount(unmatched)
    store.setRankings(matched)
    store.setStep('tracking')
  }

  function skipToTracking(rankings: RankedPlayer[]) {
    store.setRankings(rankings)
    store.setStep('tracking')
  }

  return { loading, error, unmatchedCount, loadFromFile, loadFromText, loadFromUrl, skipToTracking }
}
