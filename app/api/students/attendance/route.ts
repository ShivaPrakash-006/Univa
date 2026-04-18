import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

const THRESHOLD = 75

async function handler(request: NextRequest, _: any, user: any) {
  const student = await prisma.student.findUnique({
    where: { userId: user.userId },
    include: {
      enrollments: {
        include: {
          course: {
            include: { professor: { include: { user: true } } },
          },
        },
      },
    },
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const summaries = await Promise.all(
    student.enrollments.map(async ({ course }) => {
      const records = await prisma.attendance.findMany({
        where: { studentId: student.id, courseId: course.id },
      })

      const totalClasses = records.length
      const attended = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
      const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0

      return {
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        professorName: course.professor.user.name,
        totalClasses,
        attended,
        percentage,
        isBelowThreshold: percentage < THRESHOLD,
        records: records.map(r => ({
          date: r.date,
          status: r.status,
          timeSlot: r.timeSlot,
        })),
      }
    })
  )

  return NextResponse.json({ data: summaries })
}

export const GET = requireAuth(handler, [Role.STUDENT])
