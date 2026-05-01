import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const course = await prisma.course.findFirst({ where: { id: courseId, professorId: professor.id } })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const grades = await prisma.grade.findMany({
    where: { courseId },
    include: { student: { include: { user: { select: { name: true, collegeId: true } } } } },
  })

  return NextResponse.json({ data: grades })
}

export const GET = requireAuth(handler, [Role.PROFESSOR])
