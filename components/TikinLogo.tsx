interface TikinLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
  className?: string
}

export function TikinLogo({ size = 'md', variant = 'dark', className = '' }: TikinLogoProps) {
  const dimensions = {
    sm: { width: 70, height: 15 },
    md: { width: 105, height: 22 },
    lg: { width: 140, height: 29 }
  }

  const { width, height } = dimensions[size]

  // Determinar el color según la variante
  const colorClass = variant === 'light' ? 'text-white' : 'text-gray-900'

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 86 18"
      fill="none"
      className={`${colorClass} ${className}`}
      aria-label="Tikin"
    >
      <g fill="currentColor" clipPath="url(#tikin-clip)">
        <path d="M11.998 18H5.999v-5.999h5.999V18Zm0-6.001H5.999V6.001h5.999v5.998Zm5.998-6H0V0h17.996v5.999ZM26.995 18h-5.999v-5.999h6V18Zm0-6.001h-5.999V6.001h6v5.998Zm0-6h-5.999V0h6v5.999ZM35.994 18h-5.999v-5.999h6V18Zm11.998 0h-5.999v-5.999h6V18Zm-5.999-6.001H29.995V6.001h11.998v5.998Zm-5.999-6h-5.999V0h6v5.999Zm11.998 0h-5.999V0h6v5.999ZM56.991 18h-5.999v-5.999h6V18Zm0-6.001h-5.999V6.001h6v5.998Zm0-6h-5.999V0h6v5.999ZM65.99 18h-6v-5.999h6V18Zm11.997 0h-5.999V6.002h6V18ZM65.99 11.999H59.99V6.001h6v5.998Zm0-11.995h6v5.998h-6v-.003H59.99V0h6v.004ZM80.237 13.213h4.787V18h-4.787v-4.787Z"></path>
      </g>
      <defs>
        <clipPath id="tikin-clip">
          <path fill="currentColor" d="M0 0h86v18H0z"></path>
        </clipPath>
      </defs>
    </svg>
  )
}
