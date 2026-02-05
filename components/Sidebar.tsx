'use client'

/**
 * SIDEBAR - Menú Lateral de Navegación
 *
 * Componente reutilizable que muestra diferentes opciones según el rol
 * - Admin: Gestión de usuarios, todas las cotizaciones, solicitudes
 * - Usuario: Dashboard, mis cotizaciones, nueva cotización
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/auth'

export interface MenuItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: string | number
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Cargar perfil del usuario
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error('Error cargando perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, supabase])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading || !profile) {
    return (
      <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Opciones de menú para ADMIN
  const adminMenuItems: MenuItem[] = [
    {
      name: 'Panel de Admin',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Gestión de Usuarios',
      href: '/admin/usuarios',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Todas las Cotizaciones',
      href: '/admin/cotizaciones',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Nueva Cotización',
      href: '/bonos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
  ]

  // Opciones de menú para USUARIO
  const userMenuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Mis Cotizaciones',
      href: '/cotizaciones',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Nueva Cotización',
      href: '/bonos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
  ]

  const menuItems = profile.role === 'admin' ? adminMenuItems : userMenuItems

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen flex flex-col shadow-2xl">
      {/* Header del Sidebar */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-tikin-red to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Tikin</h2>
            <p className="text-xs text-gray-400">Simulador de Bonos</p>
          </div>
        </div>

        {/* Info del usuario */}
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          {profile.role === 'admin' && (
            <div className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-400 font-semibold">Administrador</span>
            </div>
          )}
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-tikin-red to-red-600 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <div className={isActive ? 'text-white' : 'text-gray-400'}>
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - Cerrar sesión */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-900 hover:text-white transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}
