import { useMemo } from 'react'
import { useDraftStore } from '@/store/draftStore'
import { PlayerRow } from './PlayerRow'
import { FLEX_POSITIONS, type PositionFilter } from '@/types/draft'

const POSITIONS: PositionFilter[] = ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'DL', 'LB', 'DB']

/** How many top available players to highlight */
const TOP_AVAILABLE_COUNT = 5

export function PlayerTable() {
  const {
    rankings,
    positionFilter,
    showDrafted,
    searchQuery,
    setPositionFilter,
    setShowDrafted,
    setSearchQuery,
  } = useDraftStore()

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return rankings.filter((p) => {
      if (!showDrafted && p.isDrafted) return false
      if (positionFilter === 'FLEX') {
        if (!FLEX_POSITIONS.has(p.position.toUpperCase())) return false
      } else if (positionFilter !== 'ALL' && p.position.toUpperCase() !== positionFilter) {
        return false
      }
      if (q && !p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false
      return true
    })
  }, [rankings, positionFilter, showDrafted, searchQuery])

  const topAvailableIds = useMemo(() => {
    const available = rankings.filter((p) => !p.isDrafted)
    return new Set(available.slice(0, TOP_AVAILABLE_COUNT).map((p) => p.rank))
  }, [rankings])

  const draftedCount = rankings.filter((p) => p.isDrafted).length
  const availableCount = rankings.length - draftedCount

  return (
    <div className="flex flex-col gap-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Position toggles */}
        <div className="flex flex-wrap rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                positionFilter === pos
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <svg
            className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search players…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Show drafted toggle */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
          <input
            type="checkbox"
            checked={showDrafted}
            onChange={(e) => setShowDrafted(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Show drafted
        </label>

        {/* Stats */}
        <div className="ml-auto text-xs text-gray-500 whitespace-nowrap">
          <span className="font-semibold text-gray-700">{availableCount}</span> available ·{' '}
          <span className="font-semibold text-gray-700">{draftedCount}</span> drafted ·{' '}
          {filtered.length} shown
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2.5 pl-4 pr-2 text-right font-medium">Rank</th>
              <th className="px-2 py-2.5 text-left font-medium">Pos</th>
              <th className="py-2.5 pr-3 text-left font-medium">Player</th>
              <th className="hidden px-2 py-2.5 text-right font-medium sm:table-cell" title="Age">Age</th>
              <th className="hidden px-2 py-2.5 text-right font-medium sm:table-cell" title="Value Over Replacement Player">VORP</th>
              <th className="hidden px-2 py-2.5 text-right font-medium md:table-cell" title="Points Per Game">PPG</th>
              <th className="hidden px-2 py-2.5 text-right font-medium lg:table-cell" title="Availability Score">Avail</th>
              <th className="hidden px-2 py-2.5 text-right font-medium lg:table-cell" title="Risk CV">Risk CV</th>
              <th className="hidden px-2 py-2.5 text-right font-medium xl:table-cell" title="DCF Value">DCF</th>
              <th className="py-2.5 pr-4 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-sm text-gray-400">
                  No players match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((player) => (
                <PlayerRow
                  key={player.rank}
                  player={player}
                  highlight={!player.isDrafted && topAvailableIds.has(player.rank)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
