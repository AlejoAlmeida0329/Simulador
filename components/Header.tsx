'use client'

import { TikinLogo } from './TikinLogo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/">
              <TikinLogo size="md" variant="dark" />
            </Link>
            <div className="hidden md:block h-8 w-px bg-gray-200"></div>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Simulador Tikin
              </h1>
            </div>
          </div>

          <nav className="flex gap-2">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-tikin-red text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Parafiscales
            </Link>
            <Link
              href="/bonos"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pathname === '/bonos'
                  ? 'bg-tikin-red text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Bonos
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
