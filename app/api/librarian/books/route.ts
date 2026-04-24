import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

// Search books (accessible by all authenticated users)
async function getHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const status = searchParams.get('status')

  const books = await prisma.book.findMany({
    where: {
      isArchived: false,
      ...(status ? { status: status as any } : {}),
      OR: q
        ? [
            { title: { contains: q, mode: 'insensitive' } },
            { isbn: { contains: q } },
            { subject: { contains: q, mode: 'insensitive' } },
            { authors: { has: q } },
          ]
        : undefined,
    },
    include: {
      loans: {
        where: { status: 'ACTIVE' },
        include: {
          student: { include: { user: { select: { name: true, collegeId: true } } } },
        },
        take: 1,
      },
    },
    orderBy: { title: 'asc' },
  })

  return NextResponse.json({ data: books })
}

// Add new book
async function postHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { title, isbn, authors, publisher, edition, subject } = body

  if (!title || !isbn) {
    return NextResponse.json({ error: 'Title and ISBN are required' }, { status: 400 })
  }

  const existing = await prisma.book.findUnique({ where: { isbn } })
  if (existing) return NextResponse.json({ error: 'Book with this ISBN already exists' }, { status: 409 })

  const book = await prisma.book.create({
    data: { title, isbn, authors: authors || [], publisher, edition, subject },
  })

  return NextResponse.json({ data: book }, { status: 201 })
}

// Update book
async function putHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { id, ...updates } = body

  const book = await prisma.book.update({
    where: { id },
    data: updates,
  })

  return NextResponse.json({ data: book })
}

export const GET = getHandler
export const POST = requireAuth(postHandler, [Role.LIBRARIAN])
export const PUT = requireAuth(putHandler, [Role.LIBRARIAN])
