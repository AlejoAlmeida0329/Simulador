'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth/client'
import { LogOut, Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface AppSidebarProps {
  title: string
  subtitle: string
  items: NavItem[]
}

export function AppSidebar({ title, subtitle, items }: AppSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="w-64 bg-tikin-dark-950 flex flex-col h-full border-r border-tikin-dark-800 shadow-soft-lg">
      {/* Header */}
      <div className="p-6 border-b border-tikin-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-tikin-dark-900 border border-tikin-dark-700 rounded-lg flex items-center justify-center shadow-soft">
            <Zap className="w-5 h-5 text-tikin-red" />
          </div>
          <div>
            <h2 className="font-semibold text-tikin-dark-50 tracking-tight">{title}</h2>
            <p className="text-xs text-tikin-dark-400">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-tikin-red text-white shadow-soft'
                  : 'text-tikin-dark-300 hover:bg-tikin-dark-900 hover:text-tikin-dark-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-tikin-dark-800">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-tikin-dark-300 hover:bg-tikin-dark-900 hover:text-tikin-red transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-tikin-dark-950 border-b border-tikin-dark-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-tikin-dark-300 hover:text-tikin-dark-50 rounded-lg hover:bg-tikin-dark-900 transition-colors"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-tikin-red" />
          <span className="text-tikin-dark-50 font-semibold text-sm">{title}</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 pt-14 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  )
}
