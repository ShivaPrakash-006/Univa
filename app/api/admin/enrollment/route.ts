import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function postHandler(request: NextRequest) {
  const { studentId, courseId } = await request.json()
  if (!studentId || !courseId) return NextResponse.json({ error: 'studentId and courseId required' }, { status: 400 })

  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    update: {},
    create: { studentId, courseId },
  })

  return NextResponse.json({ data: enrollment }, { status: 201 })
}

async function deleteHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  const courseId = searchParams.get('courseId')
  if (!studentId || !courseId) return NextResponse.json({ error: 'studentId and courseId required' }, { status: 400 })

  await prisma.enrollment.delete({
    where: { studentId_courseId: { studentId, courseId } },
  })

  return NextResponse.json({ message: 'Enrollment removed' })
}

export const POST = requireAuth(postHandler, [Role.ADMIN])
export const DELETE = requireAuth(deleteHandler, [Role.ADMIN])
