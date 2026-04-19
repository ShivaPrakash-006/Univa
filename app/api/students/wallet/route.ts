// src/app/api/students/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ data: transactions })
}

export const GET = requireAuth(handler, [Role.STUDENT])
