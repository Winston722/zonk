import { DraftHeader } from './DraftHeader'
import { TopAvailable } from './TopAvailable'
import { RecentPicks } from './RecentPicks'
import { PlayerTable } from '@/components/players/PlayerTable'
import { useDraftPolling } from '@/hooks/useDraftPolling'
import { useDraftStore } from '@/store/draftStore'

export function TrackingView() {
  // Start polling when this component mounts
  useDraftPolling(1000)

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
      <DraftHeader />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        {/* Main rankings table */}
        <PlayerTable />

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          <TopAvailable />
          <RecentPicks />
        </div>
      </div>
    </div>
  )
}
