import { clsx } from 'clsx'
import { Badge } from '@/components/common/Badge'
import type { RankedPlayer } from '@/types/player'

interface PlayerRowProps {
  player: RankedPlayer
  highlight?: boolean
}

function fmt(val: number | null, decimals = 1): string {
  return val !== null ? val.toFixed(decimals) : '—'
}

export function PlayerRow({ player, highlight }: PlayerRowProps) {
  const isDrafted = player.isDrafted

  return (
    <tr
      className={clsx(
        'transition-colors',
        isDrafted
          ? 'bg-gray-50 opacity-50'
          : highlight
          ? 'bg-brand-50 hover:bg-brand-100'
          : 'hover:bg-gray-50',
      )}
    >
      {/* Rank */}
      <td className="w-10 py-2.5 pl-4 pr-2 text-right font-mono text-sm font-semibold text-gray-500">
        {player.rank}
      </td>

      {/* Position */}
      <td className="w-14 px-2 py-2.5">
        <Badge label={player.position || '—'} variant="position" position={player.position} />
      </td>

      {/* Name */}
      <td className="py-2.5 pr-3 min-w-[140px]">
        <span className={clsx('font-medium', isDrafted ? 'text-gray-400 line-through' : 'text-gray-900')}>
          {player.name}
        </span>
        {player.team && <span className="ml-2 text-xs text-gray-400">{player.team}</span>}
      </td>

      {/* Age */}
      <td className="hidden w-12 px-2 py-2.5 text-right font-mono text-xs text-gray-500 sm:table-cell">
        {player.age ?? '—'}
      </td>

      {/* VORP */}
      <td className="hidden w-16 px-2 py-2.5 text-right font-mono text-sm font-semibold text-gray-700 sm:table-cell">
        {fmt(player.var, 2)}
      </td>

      {/* PPG */}
      <td className="hidden w-14 px-2 py-2.5 text-right font-mono text-xs text-gray-500 md:table-cell">
        {fmt(player.ppg)}
      </td>

      {/* Availability Score */}
      <td className="hidden w-16 px-2 py-2.5 text-right font-mono text-xs text-gray-500 lg:table-cell">
        {fmt(player.availabilityScore, 2)}
      </td>

      {/* Risk CV */}
      <td className="hidden w-14 px-2 py-2.5 text-right font-mono text-xs text-gray-500 lg:table-cell">
        {fmt(player.riskCv, 2)}
      </td>

      {/* DCF Value */}
      <td className="hidden w-16 px-2 py-2.5 text-right font-mono text-xs text-gray-500 xl:table-cell">
        {fmt(player.dcfValue, 2)}
      </td>

      {/* Draft status */}
      <td className="w-36 py-2.5 pr-4 text-right text-xs text-gray-500">
        {isDrafted ? (
          <span className="inline-flex flex-col items-end gap-0.5">
            <span className="font-medium text-gray-400">
              Pick {player.pickNumber} · Rd {player.round}
            </span>
          </span>
        ) : highlight ? (
          <Badge label="Top available" variant="success" />
        ) : null}
      </td>
    </tr>
  )
}
