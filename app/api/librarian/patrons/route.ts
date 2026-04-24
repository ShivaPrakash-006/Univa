import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, ACTIONS } from '@/lib/audit'
import { Role } from '@prisma/client'

async function getHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: {
      role: 'STUDENT',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { collegeId: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: {
      student: {
        include: {
          libraryAccount: true,
          borrowings: {
            include: { book: { select: { title: true, isbn: true } } },
            orderBy: { checkedOutAt: 'desc' },
          },
        },
      },
    },
  })

  if (!user || !user.student) {
    return NextResponse.json({ data: null })
  }

  return NextResponse.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      collegeId: user.collegeId,
      student: {
        department: user.student.department,
        semester: user.student.semester,
        programName: user.student.programName,
      },
      libraryAccount: user.student.libraryAccount,
      loans: user.student.borrowings,
    },
  })
}

async function patchHandler(request: NextRequest, _: any, user: any) {
  const { libraryAccountId, isBlocked, blockReason } = await request.json()

  await prisma.libraryAccount.update({
    where: { id: libraryAccountId },
    data: { isBlocked, blockReason: isBlocked ? blockReason : null },
  })

  if (isBlocked) {
    await createAuditLog({
      userId: user.userId,
      action: ACTIONS.ACCOUNT_BLOCKED,
      entity: 'LibraryAccount',
      entityId: libraryAccountId,
      metadata: { blockReason },
    })
  }

  return NextResponse.json({ message: isBlocked ? 'Account blocked' : 'Account unblocked' })
}

export const GET = requireAuth(getHandler, [Role.LIBRARIAN])
export const PATCH = requireAuth(patchHandler, [Role.LIBRARIAN])
