import { redirect } from 'next/navigation'

export default function Home() {
  // DEVELOP: redirigir a admin dashboard para desarrollo
  redirect('/admin/dashboard')
}
