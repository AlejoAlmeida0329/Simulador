'use client'

import { TikinLogo } from './TikinLogo'
import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/bonos">
              <TikinLogo size="md" variant="dark" />
            </Link>
            <div className="hidden md:block h-8 w-px bg-gray-200"></div>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Simulador de Bonos Tikin
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
