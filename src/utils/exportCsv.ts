import Papa from 'papaparse'
import type { RankedPlayer } from '@/types/player'

/** Serialize the board (rankings + draft outcomes) to CSV text. */
export function draftBoardToCsv(rankings: RankedPlayer[]): string {
  return Papa.unparse(
    rankings.map((p) => ({
      rank: p.rank,
      name: p.name,
      position: p.position,
      team: p.team,
      value_above_replacement: p.var ?? '',
      ppg: p.ppg ?? '',
      age: p.age ?? '',
      drafted: p.isDrafted ? 'yes' : 'no',
      pick_no: p.pickNumber ?? '',
      round: p.round ?? '',
      drafted_by: p.draftedBy ?? '',
    })),
  )
}

/** Trigger a browser download of the board as a CSV file. */
export function downloadDraftBoard(rankings: RankedPlayer[], draftId?: string): void {
  const csv = draftBoardToCsv(rankings)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zonk_draft_${draftId ?? 'board'}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
