/**
 * LOGOUT ROUTE - Server-side logout
 * Cierra la sesión en el servidor y redirige a login
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || ''
  const cookieNames = [
    `sb-${projectId}-auth-token`,
    `sb-${projectId}-auth-token.0`,
    `sb-${projectId}-auth-token.1`,
  ]

  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
    })
  })
}

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.json({ success: true })
  clearSessionCookies(response)
  return response
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/login', request.url))
  clearSessionCookies(response)
  return response
}
