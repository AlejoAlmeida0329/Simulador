'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const logout = async () => {
      // Cerrar sesión de Supabase
      await supabase.auth.signOut()
      
      // Limpiar localStorage
      localStorage.clear()
      
      // Limpiar sessionStorage
      sessionStorage.clear()
      
      // Redirigir al login después de 1 segundo
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    }
    
    logout()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block p-4 bg-gradient-to-br from-tikin-red to-red-600 rounded-2xl shadow-lg mb-4">
          <svg
            className="w-12 h-12 text-white animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cerrando sesión...
        </h1>
        <p className="text-gray-600">
          Todas las sesiones están siendo cerradas
        </p>
      </div>
    </div>
  )
}
