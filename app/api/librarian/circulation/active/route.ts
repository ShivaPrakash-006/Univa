import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest) {
  const loans = await prisma.bookLoan.findMany({
    where: { status: 'ACTIVE' },
    include: {
      book: { select: { title: true, isbn: true } },
      student: { include: { user: { select: { name: true, collegeId: true } } } },
    },
    orderBy: { dueDate: 'asc' },
  })
  return NextResponse.json({ data: loans })
}

export const GET = requireAuth(handler, [Role.LIBRARIAN])
