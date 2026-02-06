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
    <header className="bg-white border-b border-tikin-dark-200 shadow-soft">
      <div className="w-full px-8 py-5">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
          <div className="flex items-center space-x-8">
            <Link href={user ? '/dashboard' : '/bonos'} className="transition-opacity hover:opacity-80">
              <TikinLogo size="md" variant="dark" />
            </Link>
            <div className="hidden md:block h-8 w-px bg-tikin-dark-200"></div>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-tikin-dark-950 tracking-tight">
                Simulador de Bonos Tikin
              </h1>
            </div>
          </div>

          {/* Auth section */}
          <div>
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-medium text-tikin-dark-700 hover:text-tikin-dark-950 hover:bg-tikin-dark-50 rounded-lg transition-all"
              >
                Dashboard
              </Link>
            ) : !isAuthPage ? (
              <Link
                href="/login"
                className="px-6 py-2.5 text-sm font-semibold text-white bg-tikin-red hover:bg-tikin-red-700 rounded-lg transition-all shadow-soft hover:shadow-soft-md"
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
