import { useEffect, useRef, useCallback } from 'react'
import { DraftPoller } from '@/api/draftPoller'
import { useDraftStore } from '@/store/draftStore'
import { applyPicksToRankings } from '@/utils/playerMatcher'
import type { SleeperPick } from '@/types/sleeper'

/**
 * Starts polling the Sleeper picks endpoint for the active draft
 * and keeps the store's rankings up-to-date.
 *
 * Uses getState() inside the callback so we always operate on the
 * latest rankings without needing to re-create the poller.
 */
export function useDraftPolling(intervalMs = 5000) {
  const pollerRef = useRef<DraftPoller | null>(null)
  const draftDoneRef = useRef(false)
  const draftId = useDraftStore((s) => s.selectedDraft?.draft_id)

  const handlePicksUpdate = useCallback((picks: SleeperPick[]) => {
    const {
      selectedDraft,
      rankings,
      managerNames,
      setRawPicks,
      setLastUpdated,
      setPollError,
      setRankings,
    } = useDraftStore.getState()

    setRawPicks(picks)
    setLastUpdated(new Date())
    setPollError(null)

    if (rankings.length > 0) {
      const updated = applyPicksToRankings(rankings, picks, managerNames)
      setRankings(updated)
    }

    // Every pick is in — no point polling further
    if (selectedDraft) {
      const totalPicks = selectedDraft.settings.teams * selectedDraft.settings.rounds
      if (totalPicks > 0 && picks.length >= totalPicks) {
        draftDoneRef.current = true
        pollerRef.current?.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (!draftId) return

    draftDoneRef.current = false
    const poller = new DraftPoller({
      draftId,
      intervalMs,
      onPicksUpdate: handlePicksUpdate,
      onError: (err) => useDraftStore.getState().setPollError(err.message),
    })
    pollerRef.current = poller

    // Pause polling while the tab is hidden — saves battery and API calls
    const onVisibilityChange = () => {
      if (draftDoneRef.current) return
      if (document.hidden) {
        poller.stop()
      } else {
        poller.start() // start() polls immediately, so picks catch up on return
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (!document.hidden) poller.start()

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      poller.stop()
      pollerRef.current = null
    }
  }, [draftId, intervalMs, handlePicksUpdate])

  const manualRefresh = useCallback(() => {
    void pollerRef.current?.refresh()
  }, [])

  return { manualRefresh }
}
