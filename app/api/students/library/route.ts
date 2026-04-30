import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const student = await prisma.student.findUnique({
    where: { userId: user.userId },
    include: { libraryAccount: true },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const loans = await prisma.bookLoan.findMany({
    where: { studentId: student.id },
    include: { book: true },
    orderBy: { checkedOutAt: 'desc' },
  })

  return NextResponse.json({ loans, account: student.libraryAccount })
}

export const GET = requireAuth(handler, [Role.STUDENT])
