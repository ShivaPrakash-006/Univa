import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function patchHandler(request: NextRequest, _: any, user: any) {
  const { isOnline } = await request.json()

  const settings = await prisma.canteenSettings.upsert({
    where: { id: 'settings' },
    update: { isOnline, updatedBy: user.userId },
    create: { id: 'settings', isOnline, updatedBy: user.userId },
  })

  return NextResponse.json({ data: settings })
}

export const PATCH = requireAuth(patchHandler, [Role.COOK, Role.ADMIN])
