import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')
  const type = searchParams.get('type') || 'semester' // daily | monthly | semester
  const date = searchParams.get('date')
  const month = searchParams.get('month')

  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const course = await prisma.course.findFirst({ where: { id: courseId, professorId: professor.id } })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Build date filter
  let dateFilter: any = {}
  if (type === 'daily' && date) {
    const d = new Date(date)
    const nextDay = new Date(d)
    nextDay.setDate(nextDay.getDate() + 1)
    dateFilter = { gte: d, lt: nextDay }
  } else if (type === 'monthly' && month) {
    const [year, m] = month.split('-').map(Number)
    dateFilter = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { student: { include: { user: { select: { name: true, collegeId: true } } } } },
  })

  const studentSummaries = await Promise.all(
    enrollments.map(async ({ student }) => {
      const where: any = { studentId: student.id, courseId }
      if (Object.keys(dateFilter).length > 0) where.date = dateFilter

      const records = await prisma.attendance.findMany({ where })
      const present = records.filter(r => r.status === 'PRESENT').length
      const absent = records.filter(r => r.status === 'ABSENT').length
      const late = records.filter(r => r.status === 'LATE').length
      const total = records.length
      const attended = present + late
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0

      return {
        studentId: student.id,
        name: student.user.name,
        collegeId: student.user.collegeId,
        present,
        absent,
        late,
        total,
        percentage,
      }
    })
  )

  const totalSessions = studentSummaries.reduce((max, s) => Math.max(max, s.total), 0)
  const classAverage = studentSummaries.length
    ? Math.round(studentSummaries.reduce((s, st) => s + st.percentage, 0) / studentSummaries.length)
    : 0
  const belowThreshold = studentSummaries.filter(s => s.percentage < 75).length

  return NextResponse.json({
    data: { studentSummaries, totalSessions, classAverage, belowThreshold },
  })
}

export const GET = requireAuth(handler, [Role.PROFESSOR])
