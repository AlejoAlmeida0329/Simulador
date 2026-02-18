/**
 * LAYOUT ADMIN
 *
 * Layout protegido para rutas de administrador
 * Verifica que el usuario sea admin antes de renderizar
 */

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-tikin-dark-50">
      <AdminSidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main id="main-content" className="flex-1 overflow-y-auto p-8 md:p-8 pt-16 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
