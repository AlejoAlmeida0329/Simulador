/**
 * LAYOUT COMERCIAL
 *
 * Layout protegido para rutas de comercial
 * Verifica que el usuario sea comercial antes de renderizar
 */

import { redirect } from 'next/navigation'
import { requireComercial } from '@/lib/auth/server'
import { ComercialSidebarNav } from '@/components/comercial/ComercialSidebarNav'

export default async function ComercialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireComercial()
  } catch (error) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-tikin-dark-50">
      <ComercialSidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main id="main-content" className="flex-1 overflow-y-auto p-8 md:p-8 pt-16 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
