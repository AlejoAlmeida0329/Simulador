import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        'animate-spin rounded-full border-tikin-dark-200 border-t-tikin-red-600',
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  )
}
