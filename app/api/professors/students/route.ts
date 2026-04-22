import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')

  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (courseId) {
    // Verify professor owns this course
    const course = await prisma.course.findFirst({ where: { id: courseId, professorId: professor.id } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            user: { select: { name: true, collegeId: true, email: true } },
          },
        },
      },
      orderBy: { student: { user: { name: 'asc' } } },
    })

    return NextResponse.json({ data: enrollments.map(e => e.student) })
  }

  // Search student by name or ID
  const q = searchParams.get('q')
  if (q) {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { collegeId: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: { select: { name: true, collegeId: true, email: true } },
        grades: { include: { course: { select: { name: true, code: true } } } },
        attendances: true,
      },
      take: 10,
    })
    return NextResponse.json({ data: students })
  }

  return NextResponse.json({ data: [] })
}

export const GET = requireAuth(handler, [Role.PROFESSOR])
