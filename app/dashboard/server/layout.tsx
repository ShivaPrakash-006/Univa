import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import Sidebar from '@/components/shared/Sidebar'

const navItems = [
  {
    label: 'Ready to Serve',
    href: '/dashboard/server',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
]

export default async function ServerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('univa_token')?.value
  if (!token) redirect('/login')
  const user = verifyToken(token)
  if (!user || user.role !== 'CANTEEN_SERVER') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} userName={user.name} collegeId={user.collegeId} navItems={navItems} />
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  )
}
