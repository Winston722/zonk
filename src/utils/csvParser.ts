import Papa from 'papaparse'
import type { RankedPlayer } from '@/types/player'

type RawRow = Record<string, string>

/**
 * Tries to find a column value by checking a list of aliases.
 * Matching is case-insensitive and ignores non-alphanumeric characters.
 */
function col(row: RawRow, ...keys: string[]): string {
  for (const k of keys) {
    const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const [rowKey, val] of Object.entries(row)) {
      if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) {
        return (val ?? '').trim()
      }
    }
  }
  return ''
}

function parseNumber(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

/**
 * Parses a CSV file (File or string) into RankedPlayer[].
 *
 * Expected columns (case-insensitive, punctuation ignored):
 *   name            — player name  (required)
 *   position / pos  — QB, RB, WR, TE, K, DEF
 *   age
 *   years_exp / years of experience / experience / yoe
 *   ppg / points_per_game / points per game
 *   availability_score / availability score / avail
 *   risk_cv / risk cv / risk / cv
 *   dcf_value / dcf value / dcf
 *   replacement_value / replacement value / replacement
 *   value_above_replacement / value above replacement / var  ← drives ranking
 *
 * Players are sorted by VAR descending (highest VAR = rank 1).
 * If no VAR column is present, row order is preserved.
 */
export async function parseCsvRankings(source: File | string): Promise<RankedPlayer[]> {
  const text =
    typeof source === 'string'
      ? source
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsText(source)
        })

  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
    // Strip BOM, zero-width characters, and surrounding whitespace from headers
    transformHeader: (h: string) =>
      h
        .replace(/^\uFEFF/, '')            // BOM
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
        .trim(),
  })

  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === 'Delimiter')
    if (fatal) throw new Error(`CSV parse error: ${fatal.message}`)
  }

  const players = result.data
    .map((row): RankedPlayer | null => {
      const name = col(row, 'name', 'player', 'player_name', 'player name', 'full_name')
      if (!name) return null

      return {
        rank: 0, // assigned below after sorting
        name,
        normalisedName: normaliseName(name),
        position: col(row, 'position', 'pos').toUpperCase(),
        team: col(row, 'team', 'nfl_team').toUpperCase(),
        sleeperId: null,
        isDrafted: false,
        pickNumber: null,
        round: null,
        draftedBy: null,
        age: parseNumber(col(row, 'age', 'player_age', 'player age', 'age_years', 'age years')),
        yearsExp: parseNumber(
          col(row, 'years_exp', 'years of experience', 'years exp', 'experience', 'yoe', 'exp'),
        ),
        ppg: parseNumber(col(row, 'ppg', 'points_per_game', 'points per game', 'avg_points')),
        availabilityScore: parseNumber(
          col(row, 'availability_score', 'availability score', 'avail_score', 'avail'),
        ),
        riskCv: parseNumber(col(row, 'risk_cv', 'risk cv', 'risk', 'cv')),
        dcfValue: parseNumber(col(row, 'dcf_value', 'dcf value', 'dcf')),
        replacementValue: parseNumber(
          col(row, 'replacement_value', 'replacement value', 'replacement'),
        ),
        var: parseNumber(
          col(
            row,
            'value_above_replacement',
            'value above replacement',
            'vorp',
            'var',
            'varp',
            'value above replace',
          ),
        ),
      }
    })
    .filter((p): p is RankedPlayer => p !== null)

  // Sort by VAR descending; fall back to original row order if no VAR present
  const hasVar = players.some((p) => p.var !== null)
  if (hasVar) {
    players.sort((a, b) => (b.var ?? -Infinity) - (a.var ?? -Infinity))
  }

  // Assign sequential ranks after sorting
  players.forEach((p, i) => {
    p.rank = i + 1
  })

  return players
}

/** Strip suffixes (Jr., Sr., III, etc.) and lower-case for matching */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
