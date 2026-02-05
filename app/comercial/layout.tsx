/**
 * LAYOUT COMERCIAL
 *
 * Layout protegido para rutas de comercial
 * Verifica que el usuario sea comercial antes de renderizar
 */

import { redirect } from 'next/navigation'
import { requireComercial } from '@/lib/auth/server'
import ComercialSidebar from '@/components/comercial/ComercialSidebar'

export default async function ComercialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar que el usuario sea comercial (lanza error si no lo es)
  try {
    await requireComercial()
  } catch (error) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ComercialSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
