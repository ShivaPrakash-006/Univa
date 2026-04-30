import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function getHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const termId = searchParams.get('termId')

  const courses = await prisma.course.findMany({
    where: termId ? { termId } : {},
    include: {
      professor: { include: { user: { select: { name: true, collegeId: true } } } },
      term: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json({ data: courses })
}

async function postHandler(request: NextRequest) {
  const body = await request.json()
  const { code, name, credits, department, termId, professorId } = body

  if (!code || !name || !credits || !department || !termId || !professorId) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const existing = await prisma.course.findUnique({ where: { code } })
  if (existing) return NextResponse.json({ error: 'Course code already exists' }, { status: 409 })

  const course = await prisma.course.create({
    data: { code, name, credits: parseInt(credits), department, termId, professorId },
    include: {
      professor: { include: { user: { select: { name: true } } } },
      term: { select: { name: true } },
    },
  })

  return NextResponse.json({ data: course }, { status: 201 })
}

async function deleteHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.course.delete({ where: { id } })
  return NextResponse.json({ message: 'Course deleted' })
}

export const GET = requireAuth(getHandler, [Role.ADMIN])
export const POST = requireAuth(postHandler, [Role.ADMIN])
export const DELETE = requireAuth(deleteHandler, [Role.ADMIN])
