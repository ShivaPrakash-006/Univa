import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function getHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const entity = searchParams.get('entity')
  const userId = searchParams.get('userId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entity ? { entity } : {}),
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { name: true, collegeId: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.auditLog.count({
    where: {
      ...(entity ? { entity } : {}),
      ...(userId ? { userId } : {}),
    },
  })

  return NextResponse.json({ data: logs, total, page, limit })
}

export const GET = requireAuth(getHandler, [Role.ADMIN])
