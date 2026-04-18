import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const student = await prisma.student.findUnique({
    where: { userId: user.userId },
    include: {
      enrollments: { select: { courseId: true } },
    },
  })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const courseIds = student.enrollments.map(e => e.courseId)
  const timetable = await prisma.timetable.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: {
        include: {
          professor: { include: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json({ data: timetable })
}

export const GET = requireAuth(handler, [Role.STUDENT])
