import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const student = await prisma.student.findUnique({ where: { userId: user.userId } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const fees = await prisma.feePayment.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: fees })
}

export const GET = requireAuth(handler, [Role.STUDENT])
