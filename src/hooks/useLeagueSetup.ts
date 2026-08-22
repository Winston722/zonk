import { useState } from 'react'
import { sleeperApi } from '@/api/sleeper'
import { useDraftStore } from '@/store/draftStore'
import type { SleeperDraft, SleeperLeague } from '@/types/sleeper'

let seasonsCache: [string, string] | null = null

/**
 * The current and previous league seasons, from Sleeper's /state/nfl endpoint
 * (authoritative around season boundaries), falling back to calendar years.
 */
async function getSeasons(): Promise<[string, string]> {
  if (seasonsCache) return seasonsCache
  try {
    const state = await sleeperApi.getNflState()
    if (state?.league_season) {
      seasonsCache = [
        state.league_season,
        state.previous_season || String(Number(state.league_season) - 1),
      ]
      return seasonsCache
    }
  } catch {
    // fall through to calendar-year guess
  }
  const year = new Date().getFullYear()
  return [String(year), String(year - 1)]
}

function dedupeBy<T>(arr: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return arr.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function useLeagueSetup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const store = useDraftStore()

  async function lookupUser(username: string) {
    setLoading(true)
    setError(null)
    try {
      const user = await sleeperApi.getUserByUsername(username)
      if (!user?.user_id) throw new Error(`User "${username}" not found`)
      store.setUser(user)

      // Query the current and previous seasons per Sleeper's own state endpoint
      const [currentSeason, previousSeason] = await getSeasons()
      const [current, previous] = await Promise.allSettled([
        sleeperApi.getLeaguesForUser(user.user_id, currentSeason),
        sleeperApi.getLeaguesForUser(user.user_id, previousSeason),
      ])

      const leagues: SleeperLeague[] = [
        ...(current.status === 'fulfilled' ? current.value ?? [] : []),
        ...(previous.status === 'fulfilled' ? previous.value ?? [] : []),
      ]

      store.setLeagues(dedupeBy(leagues, (l) => l.league_id))
      store.setStep('league')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  async function selectLeague(leagueId: string) {
    const league = store.leagues.find((l) => l.league_id === leagueId)
    if (!league) return
    setLoading(true)
    setError(null)
    try {
      store.setSelectedLeague(league)

      const [currentSeason, previousSeason] = await getSeasons()
      const userId = store.user?.user_id

      // Fetch from league endpoint + user endpoint for both seasons (mock drafts
      // often only appear in the user-level endpoint)
      const fetches = [
        sleeperApi.getDraftsForLeague(leagueId),
        ...(userId
          ? [
              sleeperApi.getDraftsForUser(userId, currentSeason),
              sleeperApi.getDraftsForUser(userId, previousSeason),
            ]
          : []),
      ]

      const results = await Promise.allSettled(fetches)
      const allDrafts: SleeperDraft[] = results.flatMap((r) =>
        r.status === 'fulfilled' ? r.value ?? [] : [],
      )

      // Keep drafts belonging to this league
      const leagueDrafts = dedupeBy(
        allDrafts.filter((d) => d.league_id === leagueId),
        (d) => d.draft_id,
      )

      store.setDrafts(leagueDrafts)
      store.setStep('draft')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load drafts')
    } finally {
      setLoading(false)
    }
  }

  function selectDraft(draftId: string) {
    const draft = store.drafts.find((d) => d.draft_id === draftId)
    if (!draft) return
    store.setSelectedDraft(draft)
    // Clear picks from any previously tracked draft
    store.setRawPicks([])
    store.setPollError(null)
    store.setStep('rankings')
  }

  async function loadDraftById(draftId: string) {
    setLoading(true)
    setError(null)
    try {
      const draft = await sleeperApi.getDraft(draftId.trim())
      if (!draft?.draft_id) throw new Error('Draft not found')
      store.setDrafts([draft])
      store.setSelectedDraft(draft)
      store.setRawPicks([])
      store.setPollError(null)
      store.setStep('rankings')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load draft')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, lookupUser, selectLeague, selectDraft, loadDraftById }
}
