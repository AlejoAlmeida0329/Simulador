import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} bg-tikin-dark-50 min-h-screen flex flex-col antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-tikin-red focus:text-white focus:rounded-lg focus:shadow-lg">
          Saltar al contenido principal
        </a>
        <AuthProvider>
          <Header />
          <main id="main-content" className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0A0A0A',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
