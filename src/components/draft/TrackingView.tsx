import { DraftHeader } from './DraftHeader'
import { OnTheClock } from './OnTheClock'
import { TopAvailable } from './TopAvailable'
import { RecentPicks } from './RecentPicks'
import { TeamRosters } from './TeamRosters'
import { PlayerTable } from '@/components/players/PlayerTable'
import { useDraftPolling } from '@/hooks/useDraftPolling'
import { useManagerNames } from '@/hooks/useManagerNames'
import { useDraftStore } from '@/store/draftStore'

export function TrackingView() {
  // Start polling when this component mounts
  const { manualRefresh } = useDraftPolling(3000)
  useManagerNames()

  const { rankings } = useDraftStore()

  if (rankings.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-lg">No rankings loaded. Go back and upload your CSV.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <DraftHeader onRefresh={manualRefresh} />
      <OnTheClock />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        {/* Main rankings table */}
        <PlayerTable />

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          <TopAvailable />
          <RecentPicks />
          <TeamRosters />
        </div>
      </div>
    </div>
  )
}
