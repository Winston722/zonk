import { useState } from 'react'
import { sleeperApi } from '@/api/sleeper'
import { useDraftStore } from '@/store/draftStore'
import type { SleeperDraft, SleeperLeague } from '@/types/sleeper'

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

      // Try current year and previous year — NFL seasons span two calendar years
      const thisYear = new Date().getFullYear()
      const [current, previous] = await Promise.allSettled([
        sleeperApi.getLeaguesForUser(user.user_id, String(thisYear)),
        sleeperApi.getLeaguesForUser(user.user_id, String(thisYear - 1)),
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

      const thisYear = new Date().getFullYear()
      const userId = store.user?.user_id

      // Fetch from league endpoint + user endpoint for both years (mock drafts
      // often only appear in the user-level endpoint)
      const fetches = [
        sleeperApi.getDraftsForLeague(leagueId),
        ...(userId
          ? [
              sleeperApi.getDraftsForUser(userId, String(thisYear)),
              sleeperApi.getDraftsForUser(userId, String(thisYear - 1)),
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
      store.setStep('rankings')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load draft')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, lookupUser, selectLeague, selectDraft, loadDraftById }
}
