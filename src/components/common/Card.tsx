import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
}

export function Card({ children, className, padded = true, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        padded && 'p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mb-4 flex items-center justify-between', className)}>{children}</div>
  )
}

export function CardTitle({ children, className }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={clsx('text-lg font-semibold text-gray-900', className)}>{children}</h2>
  )
}
