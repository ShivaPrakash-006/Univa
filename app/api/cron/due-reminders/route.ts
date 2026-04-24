// src/app/api/cron/due-reminders/route.ts
// Call this endpoint from a cron service (e.g. Vercel Cron, GitHub Actions) daily
// Add CRON_SECRET to .env and set the Authorization header accordingly

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookDueReminder } from '@/lib/email'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  // Simple secret guard for cron endpoint
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tomorrow = addDays(new Date(), 1)
  const start = startOfDay(tomorrow)
  const end = endOfDay(tomorrow)

  // Find all loans due tomorrow that are still active
  const loans = await prisma.bookLoan.findMany({
    where: {
      status: 'ACTIVE',
      dueDate: { gte: start, lte: end },
    },
    include: {
      book: { select: { title: true } },
      student: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  const results = await Promise.allSettled(
    loans.map(async loan => {
      await sendBookDueReminder(
        loan.student.user.email,
        loan.student.user.name,
        loan.book.title,
        loan.dueDate
      )
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: loan.student.userId!,
          title: 'Book Due Tomorrow',
          body: `Your borrowed book "${loan.book.title}" is due for return tomorrow.`,
        },
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`Due reminders: ${sent} sent, ${failed} failed`)
  return NextResponse.json({ sent, failed, total: loans.length })
}
