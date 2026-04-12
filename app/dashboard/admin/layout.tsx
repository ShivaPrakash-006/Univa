import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('univa_token')?.value
  if (!token) redirect('/login')
  const user = verifyToken(token)
  if (!user || user.role !== 'ADMIN') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  )
}
