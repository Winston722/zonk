import { useEffect } from 'react'
import { sleeperApi } from '@/api/sleeper'
import { useDraftStore } from '@/store/draftStore'
import { applyPicksToRankings } from '@/utils/playerMatcher'

/**
 * Loads the league's member list so picks can show real manager/team names
 * instead of raw Sleeper user IDs. Mock drafts have no league — skipped.
 */
export function useManagerNames() {
  const leagueId = useDraftStore((s) => s.selectedDraft?.league_id)

  useEffect(() => {
    if (!leagueId) return
    let cancelled = false

    sleeperApi
      .getLeagueUsers(leagueId)
      .then((users) => {
        if (cancelled || !Array.isArray(users)) return
        const names: Record<string, string> = {}
        for (const u of users) {
          names[u.user_id] = u.metadata?.team_name || u.display_name || u.user_id
        }
        const { setManagerNames, rankings, rawPicks, setRankings } = useDraftStore.getState()
        setManagerNames(names)
        // Re-label any picks that were applied before the names arrived
        if (rankings.length > 0 && rawPicks.length > 0) {
          setRankings(applyPicksToRankings(rankings, rawPicks, names))
        }
      })
      .catch(() => {
        // names are a nicety — tracking works without them
      })

    return () => {
      cancelled = true
    }
  }, [leagueId])
}
