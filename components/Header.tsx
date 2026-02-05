'use client'

import { TikinLogo } from './TikinLogo'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

export function Header() {
  const { user } = useAuth()
  const pathname = usePathname()

  // Páginas donde no se debe mostrar el botón de login
  const isAuthPage = pathname === '/login' || pathname === '/solicitud-acceso' || pathname === '/pending-approval'

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href={user ? '/dashboard' : '/bonos'}>
              <TikinLogo size="md" variant="dark" />
            </Link>
            <div className="hidden md:block h-8 w-px bg-gray-200"></div>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Simulador de Bonos Tikin
              </h1>
            </div>
          </div>

          {/* Auth section */}
          <div>
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
              >
                Dashboard
              </Link>
            ) : !isAuthPage ? (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Ingresar
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
