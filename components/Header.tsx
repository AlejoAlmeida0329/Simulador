import { TikinLogo } from './TikinLogo'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <TikinLogo size="md" variant="dark" />
            <div className="hidden md:block h-8 w-px bg-gray-200"></div>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Simulador Tikin
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
