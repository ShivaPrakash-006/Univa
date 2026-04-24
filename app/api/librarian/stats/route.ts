import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler() {
  const [totalBooks, available, onLoan, overdueList] = await Promise.all([
    prisma.book.count({ where: { isArchived: false } }),
    prisma.book.count({ where: { status: 'AVAILABLE' } }),
    prisma.book.count({ where: { status: 'ON_LOAN' } }),
    prisma.bookLoan.findMany({
      where: { status: 'ACTIVE', dueDate: { lt: new Date() } },
      include: {
        book: { select: { title: true } },
        student: { include: { user: { select: { name: true, collegeId: true } } } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }),
  ])

  return NextResponse.json({
    data: { totalBooks, available, onLoan, overdue: overdueList.length, overdueList },
  })
}

export const GET = requireAuth(handler, [Role.LIBRARIAN])
