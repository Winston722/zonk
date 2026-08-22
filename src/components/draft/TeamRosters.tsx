import { useMemo, useState } from 'react'
import { useDraftStore } from '@/store/draftStore'
import { Badge } from '@/components/common/Badge'
import type { SleeperPick } from '@/types/sleeper'

interface Team {
  key: string
  name: string
  slot: number
  picks: SleeperPick[]
}

const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DL', 'LB', 'DB']

/** Per-manager roster panel: see what each team has taken so far. */
export function TeamRosters() {
  const { rawPicks, managerNames, selectedDraft, user } = useDraftStore()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const teams = useMemo((): Team[] => {
    const byKey = new Map<string, Team>()

    // Seed from the draft order so teams with no picks yet still show up
    for (const [userId, slot] of Object.entries(selectedDraft?.draft_order ?? {})) {
      byKey.set(userId, {
        key: userId,
        name: managerNames[userId] ?? `Slot ${slot}`,
        slot,
        picks: [],
      })
    }

    // Group by the manager who made the pick (handles traded picks), falling
    // back to the draft slot when picked_by is empty (e.g. mock draft bots)
    for (const pick of rawPicks) {
      const key = pick.picked_by || `slot-${pick.draft_slot}`
      let team = byKey.get(key)
      if (!team) {
        team = {
          key,
          name: managerNames[pick.picked_by] ?? `Slot ${pick.draft_slot}`,
          slot: pick.draft_slot,
          picks: [],
        }
        byKey.set(key, team)
      }
      team.picks.push(pick)
    }

    return [...byKey.values()].sort((a, b) => a.slot - b.slot)
  }, [rawPicks, managerNames, selectedDraft])

  if (teams.length === 0) return null

  const myKey = user?.user_id
  const activeKey =
    selectedKey ?? (teams.some((t) => t.key === myKey) ? myKey! : teams[0].key)
  const active = teams.find((t) => t.key === activeKey) ?? teams[0]

  const positionCounts = active.picks.reduce<Record<string, number>>((acc, p) => {
    const pos = p.metadata?.position ?? '?'
    acc[pos] = (acc[pos] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Rosters</h2>
        <select
          value={active.key}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="max-w-[180px] rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {teams.map((t) => (
            <option key={t.key} value={t.key}>
              {t.key === myKey ? `⭐ ${t.name}` : t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Position counts */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {POSITION_ORDER.filter((pos) => positionCounts[pos]).map((pos) => (
          <span key={pos} className="inline-flex items-center gap-1">
            <Badge label={`${pos} ${positionCounts[pos]}`} variant="position" position={pos} />
          </span>
        ))}
        {active.picks.length === 0 && (
          <span className="text-sm text-gray-400">No picks yet.</span>
        )}
      </div>

      {/* Pick list */}
      {active.picks.length > 0 && (
        <ol className="space-y-1.5">
          {active.picks
            .slice()
            .sort((a, b) => a.pick_no - b.pick_no)
            .map((pick) => (
              <li key={pick.pick_no} className="flex items-center gap-3 text-sm">
                <span className="w-10 text-right font-mono text-xs text-gray-400">
                  {pick.round}.{pick.draft_slot}
                </span>
                <Badge
                  label={pick.metadata?.position ?? '—'}
                  variant="position"
                  position={pick.metadata?.position}
                />
                <span className="flex-1 truncate font-medium text-gray-900">
                  {pick.metadata?.first_name} {pick.metadata?.last_name}
                </span>
                <span className="text-xs text-gray-400">{pick.metadata?.team}</span>
              </li>
            ))}
        </ol>
      )}
    </div>
  )
}
