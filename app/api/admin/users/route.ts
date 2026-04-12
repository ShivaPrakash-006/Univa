import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { createAuditLog, ACTIONS } from '@/lib/audit'
import { Role } from '@prisma/client'

async function getHandler(request: NextRequest, _: any, user: any) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const q = searchParams.get('q')

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as Role } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { collegeId: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      collegeId: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: users })
}

async function postHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { collegeId, email, name, role, password } = body

  if (!collegeId || !email || !name || !role || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  const newUser = await prisma.user.create({
    data: { collegeId, email, name, role, passwordHash },
  })

  // Create role-specific record
  if (role === Role.STUDENT) {
    const student = await prisma.student.create({
      data: {
        userId: newUser.id,
        batch: body.batch || '',
        semester: body.semester || 1,
        department: body.department || '',
        programName: body.programName || '',
      },
    })
    await prisma.libraryAccount.create({ data: { studentId: student.id } })
  } else if (role === Role.PROFESSOR) {
    await prisma.professor.create({
      data: {
        userId: newUser.id,
        department: body.department || '',
        designation: body.designation || '',
      },
    })
  }

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.USER_CREATED,
    entity: 'User',
    entityId: newUser.id,
    metadata: { role, collegeId },
  })

  return NextResponse.json({ data: { id: newUser.id, collegeId, name, email, role } }, { status: 201 })
}

async function patchHandler(request: NextRequest, _: any, user: any) {
  const { id, isActive } = await request.json()

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
  })

  if (!isActive) {
    await createAuditLog({
      userId: user.userId,
      action: ACTIONS.USER_DEACTIVATED,
      entity: 'User',
      entityId: id,
    })
  }

  return NextResponse.json({ data: updated })
}

export const GET = requireAuth(getHandler, [Role.ADMIN])
export const POST = requireAuth(postHandler, [Role.ADMIN])
export const PATCH = requireAuth(patchHandler, [Role.ADMIN])
