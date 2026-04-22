import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, ACTIONS } from '@/lib/audit'
import { Role } from '@prisma/client'

// Enter or update grades
async function putHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { studentId, courseId, internalMarks, midtermMarks, practicalMarks, endSemMarks, finalGrade } = body

  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: professor.id },
  })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  if (course.gradeLocked) {
    return NextResponse.json({ error: 'Grades are locked. Administrator approval required to change.' }, { status: 403 })
  }

  const existing = await prisma.grade.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  })

  const grade = existing
    ? await prisma.grade.update({
        where: { studentId_courseId: { studentId, courseId } },
        data: { internalMarks, midtermMarks, practicalMarks, endSemMarks, finalGrade, lastEditedBy: user.userId },
      })
    : await prisma.grade.create({
        data: { studentId, courseId, internalMarks, midtermMarks, practicalMarks, endSemMarks, finalGrade, lastEditedBy: user.userId },
      })

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.GRADE_CHANGE,
    entity: 'Grade',
    entityId: grade.id,
    metadata: { courseId, studentId },
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  })

  return NextResponse.json({ data: grade })
}

// Lock grades
async function postHandler(request: NextRequest, _: any, user: any) {
  const { courseId } = await request.json()

  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: professor.id },
  })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  await prisma.course.update({
    where: { id: courseId },
    data: { gradeLocked: true },
  })

  await prisma.grade.updateMany({
    where: { courseId },
    data: { isLocked: true, lockedAt: new Date(), lockedBy: user.userId },
  })

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.GRADE_LOCK,
    entity: 'Course',
    entityId: courseId,
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  })

  return NextResponse.json({ message: 'Grades locked successfully' })
}

export const PUT = requireAuth(putHandler, [Role.PROFESSOR])
export const POST = requireAuth(postHandler, [Role.PROFESSOR])
