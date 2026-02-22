import { useMemo } from 'react'
import { useDraftStore } from '@/store/draftStore'
import { Badge } from '@/components/common/Badge'

const SHOW_LAST = 8

export function RecentPicks() {
  const { rawPicks } = useDraftStore()

  const recent = useMemo(
    () => [...rawPicks].sort((a, b) => b.pick_no - a.pick_no).slice(0, SHOW_LAST),
    [rawPicks],
  )

  if (recent.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Recent Picks
        </h2>
        <p className="text-sm text-gray-400">No picks yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Recent Picks
      </h2>
      <ol className="space-y-1.5">
        {recent.map((pick) => (
          <li key={pick.pick_no} className="flex items-center gap-3 text-sm">
            <span className="w-10 text-right font-mono text-xs text-gray-400">
              {pick.round}.{pick.draft_slot}
            </span>
            <Badge
              label={pick.metadata.position}
              variant="position"
              position={pick.metadata.position}
            />
            <span className="flex-1 font-medium text-gray-900 truncate">
              {pick.metadata.first_name} {pick.metadata.last_name}
            </span>
            <span className="text-xs text-gray-400">{pick.metadata.team}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
