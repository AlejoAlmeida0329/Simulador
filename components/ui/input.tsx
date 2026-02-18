import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  description?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, description, id, ...props }, ref) => {
    const inputId = id || React.useId()
    const errorId = `${inputId}-error`
    const descId = `${inputId}-desc`

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-tikin-dark-700">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-tikin-dark-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-tikin-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tikin-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : description ? descId : undefined}
          ref={ref}
          {...props}
        />
        {description && !error && (
          <p id={descId} className="text-xs text-tikin-dark-400">{description}</p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-600" role="alert">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
