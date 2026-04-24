import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, ACTIONS } from '@/lib/audit'
import { Role } from '@prisma/client'
import { addDays, differenceInDays } from 'date-fns'

const LOAN_DAYS = parseInt(process.env.LIBRARY_LOAN_DAYS || '14')
const FINE_PER_DAY = parseFloat(process.env.LIBRARY_FINE_PER_DAY || '2')

// Checkout a book
async function postHandler(request: NextRequest, _: any, user: any) {
  const { bookId, studentCollegeId } = await request.json()

  const [book, studentUser] = await Promise.all([
    prisma.book.findUnique({ where: { id: bookId } }),
    prisma.user.findUnique({
      where: { collegeId: studentCollegeId },
      include: { student: { include: { libraryAccount: true } } },
    }),
  ])

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  if (book.status !== 'AVAILABLE') return NextResponse.json({ error: 'Book is not available' }, { status: 409 })

  const student = studentUser?.student
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const libraryAccount = student.libraryAccount
  if (!libraryAccount) return NextResponse.json({ error: 'No library account found' }, { status: 404 })
  if (libraryAccount.isBlocked) return NextResponse.json({ error: 'Library account is blocked' }, { status: 403 })

  const dueDate = addDays(new Date(), LOAN_DAYS)

  const [loan] = await prisma.$transaction([
    prisma.bookLoan.create({
      data: {
        bookId,
        studentId: student.id,
        libraryAccountId: libraryAccount.id,
        dueDate,
        checkedOutBy: user.userId,
      },
    }),
    prisma.book.update({ where: { id: bookId }, data: { status: 'ON_LOAN' } }),
  ])

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.BOOK_CHECKOUT,
    entity: 'BookLoan',
    entityId: loan.id,
    metadata: { bookId, studentId: student.id, dueDate },
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  })

  return NextResponse.json({ data: { ...loan, dueDate } }, { status: 201 })
}

// Return a book
async function putHandler(request: NextRequest, _: any, user: any) {
  const { loanId, waiveFine, waiveReason } = await request.json()

  const loan = await prisma.bookLoan.findUnique({
    where: { id: loanId },
    include: { book: true, libraryAccount: true },
  })

  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
  if (loan.status === 'RETURNED') return NextResponse.json({ error: 'Book already returned' }, { status: 400 })

  const now = new Date()
  const overdueDays = Math.max(0, differenceInDays(now, loan.dueDate))
  const fineAmount = overdueDays * FINE_PER_DAY

  await prisma.$transaction([
    prisma.bookLoan.update({
      where: { id: loanId },
      data: {
        returnedAt: now,
        status: 'RETURNED',
        fineAmount: waiveFine ? 0 : fineAmount,
        fineWaived: waiveFine || false,
        waivedReason: waiveFine ? waiveReason : null,
        checkedInBy: user.userId,
      },
    }),
    prisma.book.update({ where: { id: loan.bookId }, data: { status: 'AVAILABLE' } }),
    ...(fineAmount > 0 && !waiveFine
      ? [
          prisma.libraryAccount.update({
            where: { id: loan.libraryAccountId },
            data: { totalFines: { increment: fineAmount } },
          }),
        ]
      : []),
  ])

  if (waiveFine && fineAmount > 0) {
    await createAuditLog({
      userId: user.userId,
      action: ACTIONS.FINE_WAIVED,
      entity: 'BookLoan',
      entityId: loanId,
      metadata: { fineAmount, waiveReason },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })
  }

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.BOOK_RETURN,
    entity: 'BookLoan',
    entityId: loanId,
    metadata: { overdueDays, fineAmount },
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
  })

  return NextResponse.json({ data: { overdueDays, fineAmount: waiveFine ? 0 : fineAmount } })
}

export const POST = requireAuth(postHandler, [Role.LIBRARIAN])
export const PUT = requireAuth(putHandler, [Role.LIBRARIAN])
