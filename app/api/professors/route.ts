import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler() {
  const professors = await prisma.professor.findMany({
    include: {
      user: { select: { name: true, collegeId: true } },
    },
    orderBy: { user: { name: 'asc' } },
  })

  return NextResponse.json({ data: professors })
}

export const GET = requireAuth(handler, [Role.ADMIN])
