import { useDraftStore } from '@/store/draftStore'
import { useDraftPolling } from '@/hooks/useDraftPolling'
import { Button } from '@/components/common/Button'

const STATUS_COLORS: Record<string, string> = {
  drafting: 'bg-green-100 text-green-800',
  paused: 'bg-amber-100 text-amber-800',
  complete: 'bg-gray-100 text-gray-600',
  pre_draft: 'bg-blue-100 text-blue-800',
}

export function DraftHeader() {
  const { selectedDraft, selectedLeague, lastUpdated, pollError, rawPicks } = useDraftStore()
  const { manualRefresh } = useDraftPolling()

  if (!selectedDraft) return null

  const draftName =
    selectedDraft.metadata?.name || `${selectedDraft.season} Draft`
  const statusClass = STATUS_COLORS[selectedDraft.status] ?? 'bg-gray-100 text-gray-600'
  const currentPick = rawPicks.length + 1
  const totalPicks = selectedDraft.settings.teams * selectedDraft.settings.rounds
  const currentRound = rawPicks.length > 0
    ? rawPicks[rawPicks.length - 1].round
    : 1

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{draftName}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
            {selectedDraft.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {selectedLeague?.name} · Pick {Math.min(currentPick, totalPicks)} of {totalPicks} · Round {currentRound}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {pollError && (
          <span className="text-xs text-red-500">⚠ {pollError}</span>
        )}
        {lastUpdated && !pollError && (
          <span className="text-xs text-gray-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <Button variant="secondary" size="sm" onClick={manualRefresh}>
          ↻ Refresh
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => useDraftStore.getState().setStep('username')}
        >
          New draft
        </Button>
      </div>
    </div>
  )
}
