/**
 * LOGOUT ROUTE - Server-side logout
 * Cierra la sesión en el servidor y redirige a login
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Cerrar sesión en el servidor
  await supabase.auth.signOut()

  // Redirigir a login con headers que limpian cookies
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))

  // Limpiar todas las cookies de Supabase
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')

  // Limpiar cookies con todos los posibles nombres
  const cookieNames = [
    'sb-zcwcotimczwdiawyhszb-auth-token',
    'sb-zcwcotimczwdiawyhszb-auth-token.0',
    'sb-zcwcotimczwdiawyhszb-auth-token.1'
  ]

  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
    })
  })

  return response
}
