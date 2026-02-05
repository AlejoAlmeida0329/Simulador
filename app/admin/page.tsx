/**
 * ADMIN ROOT PAGE - Redirect to Dashboard
 * Redirige a /admin/dashboard automáticamente
 */

import { redirect } from 'next/navigation'

export default function AdminRootPage() {
  redirect('/admin/dashboard')
}
