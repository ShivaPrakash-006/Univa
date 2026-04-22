import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function handler(request: NextRequest, _: any, user: any) {
  const professor = await prisma.professor.findUnique({ where: { userId: user.userId } })
  if (!professor) return NextResponse.json({ error: 'Professor not found' }, { status: 404 })

  const courses = await prisma.course.findMany({
    where: { professorId: professor.id },
    include: {
      term: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json({ data: courses })
}

export const GET = requireAuth(handler, [Role.PROFESSOR])
