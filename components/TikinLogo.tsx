interface TikinLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
}

export function TikinLogo({ size = 'md', variant = 'light' }: TikinLogoProps) {
  const fillColor = variant === 'light' ? '#FFFFFF' : '#000000'

  const dimensions = {
    sm: { width: 110, height: 32 },
    md: { width: 165, height: 48 },
    lg: { width: 220, height: 64 }
  }

  const { width, height } = dimensions[size]

  return (
    <div className="flex items-center">
      <svg
        width={width}
        height={height}
        viewBox="0 0 220 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="select-none"
      >
        {/* T - barra horizontal superior */}
        <rect x="0" y="12" width="44" height="12" fill={fillColor}/>
        {/* T - barra vertical */}
        <rect x="16" y="24" width="12" height="28" fill={fillColor}/>

        {/* I - barra vertical completa */}
        <rect x="52" y="12" width="16" height="40" fill={fillColor}/>

        {/* K - barra vertical izquierda */}
        <rect x="76" y="12" width="12" height="40" fill={fillColor}/>
        {/* K - diagonal superior parte 1 */}
        <rect x="88" y="12" width="12" height="12" fill={fillColor}/>
        {/* K - diagonal superior parte 2 */}
        <rect x="100" y="24" width="12" height="12" fill={fillColor}/>
        {/* K - diagonal inferior parte 1 */}
        <rect x="88" y="28" width="12" height="12" fill={fillColor}/>
        {/* K - diagonal inferior parte 2 */}
        <rect x="100" y="40" width="12" height="12" fill={fillColor}/>

        {/* i minúscula - punto superior */}
        <rect x="120" y="12" width="8" height="8" fill={fillColor}/>
        {/* i minúscula - barra vertical */}
        <rect x="120" y="28" width="8" height="24" fill={fillColor}/>

        {/* n minúscula - barra vertical izquierda */}
        <rect x="136" y="28" width="8" height="24" fill={fillColor}/>
        {/* n minúscula - curva superior */}
        <rect x="144" y="28" width="8" height="8" fill={fillColor}/>
        {/* n minúscula - barra vertical derecha */}
        <rect x="152" y="28" width="8" height="24" fill={fillColor}/>

        {/* . punto final */}
        <rect x="168" y="44" width="8" height="8" fill={fillColor}/>
      </svg>
    </div>
  )
}
