import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function getHandler() {
  const terms = await prisma.academicTerm.findMany({
    include: { _count: { select: { courses: true, timetables: true } } },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json({ data: terms })
}

async function postHandler(request: NextRequest, _: any, user: any) {
  const { name, startDate, endDate, isActive } = await request.json()
  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: 'Name, start date, and end date are required' }, { status: 400 })
  }

  // If setting active, deactivate others first
  if (isActive) {
    await prisma.academicTerm.updateMany({ data: { isActive: false } })
  }

  const term = await prisma.academicTerm.create({
    data: { name, startDate: new Date(startDate), endDate: new Date(endDate), isActive: isActive || false },
  })
  return NextResponse.json({ data: term }, { status: 201 })
}

async function patchHandler(request: NextRequest) {
  const { id, isActive } = await request.json()
  if (isActive) {
    // Deactivate all then set this one active
    await prisma.academicTerm.updateMany({ data: { isActive: false } })
  }
  const term = await prisma.academicTerm.update({
    where: { id },
    data: { isActive },
  })
  return NextResponse.json({ data: term })
}

export const GET = requireAuth(getHandler, [Role.ADMIN])
export const POST = requireAuth(postHandler, [Role.ADMIN])
export const PATCH = requireAuth(patchHandler, [Role.ADMIN])
