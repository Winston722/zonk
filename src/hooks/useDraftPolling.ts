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
  const selectedDraft = useDraftStore((s) => s.selectedDraft)

  const handlePicksUpdate = useCallback((picks: SleeperPick[]) => {
    const { rankings, setRawPicks, setLastUpdated, setPollError, setRankings } =
      useDraftStore.getState()

    setRawPicks(picks)
    setLastUpdated(new Date())
    setPollError(null)

    if (rankings.length > 0) {
      const updated = applyPicksToRankings(rankings, picks, {})
      setRankings(updated)
    }
  }, [])

  useEffect(() => {
    if (!selectedDraft) return

    pollerRef.current = new DraftPoller({
      draftId: selectedDraft.draft_id,
      intervalMs,
      onPicksUpdate: handlePicksUpdate,
      onError: (err) => useDraftStore.getState().setPollError(err.message),
    })
    pollerRef.current.start()

    return () => {
      pollerRef.current?.stop()
      pollerRef.current = null
    }
  }, [selectedDraft?.draft_id, intervalMs, handlePicksUpdate])

  const manualRefresh = useCallback(() => {
    void pollerRef.current?.refresh()
  }, [])

  return { manualRefresh }
}
