import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [students, professors, books, activeLoans, ordersToday, activeUsers, recentLogs] = await Promise.all([
    prisma.student.count(),
    prisma.professor.count(),
    prisma.book.count({ where: { isArchived: false } }),
    prisma.bookLoan.count({ where: { status: 'ACTIVE' } }),
    prisma.canteenOrder.count({ where: { placedAt: { gte: today } } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({
    data: { students, professors, books, activeLoans, ordersToday, activeUsers, recentLogs },
  })
}

export const GET = requireAuth(handler, [Role.ADMIN])
