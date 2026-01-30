import { TikinLogo } from './TikinLogo'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <TikinLogo size="sm" variant="dark" />
          </div>

          <div className="text-sm text-gray-600">
            © 2026 Tikin. Herramienta informativa.
          </div>
        </div>
      </div>
    </footer>
  )
}
