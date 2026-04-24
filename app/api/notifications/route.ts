// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

async function getHandler(request: NextRequest, _: any, user: any) {
  const notifications = await prisma.notification.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ data: notifications })
}

async function patchHandler(request: NextRequest, _: any, user: any) {
  const { id } = await request.json()
  await prisma.notification.update({
    where: { id, userId: user.userId },
    data: { isRead: true },
  })
  return NextResponse.json({ message: 'Marked as read' })
}

export const GET = requireAuth(getHandler)
export const PATCH = requireAuth(patchHandler)
