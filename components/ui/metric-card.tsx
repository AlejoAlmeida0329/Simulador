import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-tikin-dark-100 border-tikin-dark-200',
  iconColor = 'text-tikin-dark-700',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 hover:shadow-soft-md transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-tikin-dark-600">{title}</p>
          <p className="text-3xl font-bold text-tikin-dark-950 mt-2">{value}</p>
        </div>
        <div
          className={cn(
            'w-12 h-12 border rounded-lg flex items-center justify-center',
            iconBgColor
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  )
}
