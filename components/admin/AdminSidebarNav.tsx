'use client'

import { Home, Users, FileText, Settings, UserCog } from 'lucide-react'
import { AppSidebar, type NavItem } from '@/components/ui/app-sidebar'

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Comerciales', href: '/admin/comerciales', icon: Users },
  { name: 'Cotizaciones', href: '/admin/cotizaciones', icon: FileText },
  { name: 'Fees / Comisiones', href: '/admin/fees', icon: Settings },
  { name: 'Usuarios', href: '/admin/usuarios', icon: UserCog },
]

export function AdminSidebarNav() {
  return (
    <AppSidebar
      title="Tikin Admin"
      subtitle="Panel de control"
      items={adminNavItems}
    />
  )
}
