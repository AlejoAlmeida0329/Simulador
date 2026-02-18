import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface ActionCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  variant?: 'primary' | 'default'
}

export function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  variant = 'default',
}: ActionCardProps) {
  const isPrimary = variant === 'primary'

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-4 p-5 rounded-lg border transition-all duration-200 group',
        isPrimary
          ? 'border-tikin-dark-200 hover:border-tikin-red hover:bg-tikin-red-50'
          : 'border-tikin-dark-200 hover:border-tikin-dark-400 hover:bg-tikin-dark-50'
      )}
    >
      <div
        className={cn(
          'w-11 h-11 border rounded-lg flex items-center justify-center transition-all',
          isPrimary
            ? 'bg-tikin-red-50 border-tikin-red-200 group-hover:bg-tikin-red group-hover:border-tikin-red'
            : 'bg-tikin-dark-100 border-tikin-dark-200 group-hover:bg-tikin-dark-900 group-hover:border-tikin-dark-700'
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5 transition-colors',
            isPrimary
              ? 'text-tikin-red group-hover:text-white'
              : 'text-tikin-dark-700 group-hover:text-white'
          )}
        />
      </div>
      <div>
        <p
          className={cn(
            'font-semibold transition-colors',
            isPrimary
              ? 'text-tikin-dark-950 group-hover:text-tikin-red'
              : 'text-tikin-dark-950'
          )}
        >
          {title}
        </p>
        <p className="text-sm text-tikin-dark-600">{description}</p>
      </div>
    </Link>
  )
}
