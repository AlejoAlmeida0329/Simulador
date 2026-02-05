/**
 * LAYOUT ADMIN
 *
 * Layout protegido para rutas de administrador
 * Verifica que el usuario sea admin antes de renderizar
 */

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar que el usuario sea admin (lanza error si no lo es)
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

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
