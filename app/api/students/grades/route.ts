import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const student = await prisma.student.findUnique({ where: { userId: user.userId } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const grades = await prisma.grade.findMany({
    where: { studentId: student.id, course: { gradeLocked: true } },
    include: { course: { select: { code: true, name: true, credits: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const allGrades = await prisma.grade.findMany({
    where: { studentId: student.id },
    include: { course: { select: { code: true, name: true, credits: true, gradeLocked: true } } },
  })

  return NextResponse.json({ data: allGrades })
}

export const GET = requireAuth(handler, [Role.STUDENT])
