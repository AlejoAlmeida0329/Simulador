'use client'

export function LegalFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Disclaimer Legal */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Aviso Legal:</strong> Este cotizador no constituye asesoría legal, contable o laboral.
            Los cálculos son estimaciones con fines informativos. Consulte con su asesor profesional para decisiones específicas.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} <span className="text-tikin-red font-semibold">Tikin</span>. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
