import { clsx } from 'clsx'

type Variant = 'qb' | 'rb' | 'wr' | 'te' | 'dl' | 'lb' | 'db' | 'flex' | 'neutral' | 'drafted' | 'success' | 'warn'

const variantClasses: Record<Variant, string> = {
  qb: 'bg-red-100 text-red-800',
  rb: 'bg-green-100 text-green-800',
  wr: 'bg-blue-100 text-blue-800',
  te: 'bg-orange-100 text-orange-800',
  dl: 'bg-purple-100 text-purple-800',
  lb: 'bg-yellow-100 text-yellow-800',
  db: 'bg-pink-100 text-pink-800',
  flex: 'bg-indigo-100 text-indigo-800',
  neutral: 'bg-gray-100 text-gray-700',
  drafted: 'bg-gray-200 text-gray-400 line-through',
  success: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
}

function positionVariant(pos: string): Variant {
  const p = pos.toUpperCase()
  if (p === 'QB') return 'qb'
  if (p === 'RB') return 'rb'
  if (p === 'WR') return 'wr'
  if (p === 'TE') return 'te'
  if (p === 'DL') return 'dl'
  if (p === 'LB') return 'lb'
  if (p === 'DB') return 'db'
  if (p === 'FLEX') return 'flex'
  return 'neutral'
}

interface BadgeProps {
  label: string
  variant?: Variant | 'position'
  position?: string
  className?: string
}

export function Badge({ label, variant = 'neutral', position, className }: BadgeProps) {
  const resolved: Variant =
    variant === 'position' && position ? positionVariant(position) : (variant as Variant)
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold',
        variantClasses[resolved],
        className,
      )}
    >
      {label}
    </span>
  )
}
