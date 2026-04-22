import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, ACTIONS } from '@/lib/audit'
import { Role } from '@prisma/client'

// Mark attendance
async function postHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { courseId, date, timeSlot, records } = body
  // records: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }>

  if (!courseId || !date || !timeSlot || !records?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify professor owns this course
  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: professor.id },
  })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const attendanceDate = new Date(date)

  await prisma.$transaction(
    records.map((r: any) =>
      prisma.attendance.upsert({
        where: {
          studentId_courseId_date_timeSlot: {
            studentId: r.studentId,
            courseId,
            date: attendanceDate,
            timeSlot,
          },
        },
        create: {
          studentId: r.studentId,
          courseId,
          date: attendanceDate,
          timeSlot,
          status: r.status,
          markedBy: user.userId,
        },
        update: {
          status: r.status,
          editedAt: new Date(),
          editReason: r.editReason || 'Updated by professor',
        },
      })
    )
  )

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.ATTENDANCE_MARK,
    entity: 'Attendance',
    entityId: courseId,
    metadata: { courseId, date, timeSlot, count: records.length },
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  })

  return NextResponse.json({ message: 'Attendance recorded successfully' })
}

// Get attendance for a course
async function getHandler(request: NextRequest, _: any, user: any) {
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')
  const studentId = searchParams.get('studentId')

  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const where: any = {}
  if (courseId) where.courseId = courseId
  if (studentId) where.studentId = studentId

  const records = await prisma.attendance.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true, collegeId: true } } } },
      course: { select: { name: true, code: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ data: records })
}

export const POST = requireAuth(postHandler, [Role.PROFESSOR])
export const GET = requireAuth(getHandler, [Role.PROFESSOR])
