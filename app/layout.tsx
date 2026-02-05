import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Simulador de Bonos - Tikin',
  description: 'Calcula el ahorro con el modelo de bonos de flexibilidad salarial de Tikin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
