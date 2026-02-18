import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('p-12 text-center', className)}>
      <div className="w-16 h-16 bg-tikin-dark-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-tikin-dark-400" />
      </div>
      <h3 className="text-lg font-semibold text-tikin-dark-950 mb-1">{title}</h3>
      <p className="text-tikin-dark-600 text-sm mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-tikin-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-tikin-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
