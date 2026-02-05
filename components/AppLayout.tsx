'use client'

/**
 * APP LAYOUT - Layout con Sidebar
 *
 * Wrapper que incluye el Sidebar para páginas autenticadas
 * - Incluye sidebar lateral
 * - Header opcional
 * - Área de contenido principal
 */

import { Sidebar } from './Sidebar'
import { TikinLogo } from './TikinLogo'

interface AppLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
}

export function AppLayout({ children, showHeader = true }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {showHeader && (
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="px-8 py-4">
              <div className="flex items-center gap-4">
                <TikinLogo size="sm" variant="dark" />
                <div className="h-6 w-px bg-gray-200"></div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Simulador de Bonos
                </h1>
              </div>
            </div>
          </header>
        )}

        {/* Área de contenido */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
