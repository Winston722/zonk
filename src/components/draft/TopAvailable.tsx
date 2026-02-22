import { useMemo } from 'react'
import { useDraftStore } from '@/store/draftStore'
import { Badge } from '@/components/common/Badge'

const TOP_N = 10

export function TopAvailable() {
  const { rankings } = useDraftStore()

  const topAvailable = useMemo(
    () => rankings.filter((p) => !p.isDrafted).slice(0, TOP_N),
    [rankings],
  )

  if (topAvailable.length === 0) return null

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-brand-900 uppercase tracking-wide">
        Top {TOP_N} Available
      </h2>
      <ol className="space-y-1.5">
        {topAvailable.map((player, i) => (
          <li key={player.rank} className="flex items-center gap-3">
            <span className="w-5 text-right font-mono text-xs font-bold text-brand-600">
              {i + 1}
            </span>
            <Badge label={player.position || '—'} variant="position" position={player.position} />
            <span className="flex-1 text-sm font-medium text-gray-900">{player.name}</span>
            {player.team && (
              <span className="text-xs text-gray-400">{player.team}</span>
            )}
            <span className="font-mono text-xs text-gray-400">#{player.rank}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
