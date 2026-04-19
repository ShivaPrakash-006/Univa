import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog, ACTIONS } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)

  if (user) {
    await createAuditLog({
      userId: user.userId,
      action: ACTIONS.LOGOUT,
      entity: 'User',
      entityId: user.userId,
    })
  }

  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete('univa_token')
  return response
}
