'use client'

import { Home, FileText } from 'lucide-react'
import { AppSidebar, type NavItem } from '@/components/ui/app-sidebar'

const comercialNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/comercial/dashboard', icon: Home },
  { name: 'Mis Cotizaciones', href: '/comercial/cotizaciones', icon: FileText },
]

export function ComercialSidebarNav() {
  return (
    <AppSidebar
      title="Tikin Comercial"
      subtitle="Mi panel"
      items={comercialNavItems}
    />
  )
}
