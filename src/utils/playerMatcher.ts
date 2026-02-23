/**
 * Matches custom-ranked players to Sleeper player_ids.
 *
 * Strategy (in order):
 *   1. Exact normalised-name + position match
 *   2. Exact normalised-name match (position may differ in source data)
 *   3. Last-name + position match (for single-name entries like "DEF" or "K")
 */

import type { RankedPlayer } from '@/types/player'
import type { SleeperPlayersMap } from '@/types/sleeper'
import { normaliseName } from './csvParser'

interface SleeperEntry {
  id: string
  normName: string
  position: string
  team: string
  age: number | null
  yearsExp: number | null
}

function buildIndex(players: SleeperPlayersMap): SleeperEntry[] {
  return Object.entries(players)
    .filter(([, p]) => p.position && (p.full_name ?? p.first_name))
    .map(([id, p]) => ({
      id,
      normName: normaliseName(p.full_name ?? `${p.first_name} ${p.last_name}`),
      position: p.position.toUpperCase(),
      team: (p.team ?? '').toUpperCase(),
      age: p.age ?? null,
      yearsExp: p.years_exp ?? null,
    }))
}

export function matchRankingsToSleeper(
  rankings: RankedPlayer[],
  sleeperPlayers: SleeperPlayersMap,
): RankedPlayer[] {
  const index = buildIndex(sleeperPlayers)

  return rankings.map((player) => {
    const norm = player.normalisedName
    const pos = player.position.toUpperCase()

    // 1. Exact name + position
    let match = index.find((e) => e.normName === norm && e.position === pos)

    // 2. Exact name only
    if (!match) {
      match = index.find((e) => e.normName === norm)
    }

    // 3. Last-word of name + position (catches "Patrick Mahomes" vs "Mahomes")
    if (!match) {
      const parts = norm.split(' ')
      const lastName = parts[parts.length - 1] ?? ''
      if (lastName.length > 2) {
        match = index.find(
          (e) =>
            e.position === pos &&
            (e.normName.endsWith(` ${lastName}`) || e.normName === lastName),
        )
      }
    }

    if (!match) return player

    return {
      ...player,
      sleeperId: match.id,
      // Backfill fields not provided in the CSV from Sleeper's player DB
      position: player.position || match.position,
      team: player.team || match.team,
      age: player.age ?? match.age,
      yearsExp: player.yearsExp ?? match.yearsExp,
    }
  })
}

/**
 * Applies draft picks to the rankings list, marking drafted players.
 * Uses Sleeper player_id when available, falls back to normalised name matching.
 */
export function applyPicksToRankings(
  rankings: RankedPlayer[],
  picks: Array<{
    player_id: string
    pick_no: number
    round: number
    metadata: { first_name: string; last_name: string }
    picked_by: string
  }>,
  managerNames: Record<string, string>,
): RankedPlayer[] {
  const pickedById = new Map(picks.map((p) => [p.player_id, p]))
  const pickedByName = new Map(
    picks.map((p) => [normaliseName(`${p.metadata.first_name} ${p.metadata.last_name}`), p]),
  )

  return rankings.map((player) => {
    const pick =
      (player.sleeperId ? pickedById.get(player.sleeperId) : undefined) ??
      pickedByName.get(player.normalisedName)

    if (!pick) return { ...player, isDrafted: false, pickNumber: null, round: null, draftedBy: null }

    return {
      ...player,
      isDrafted: true,
      pickNumber: pick.pick_no,
      round: pick.round,
      draftedBy: managerNames[pick.picked_by] ?? pick.picked_by,
    }
  })
}
