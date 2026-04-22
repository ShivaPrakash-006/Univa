import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

// Get all menu items (public within authenticated users)
async function getHandler(request: NextRequest) {
  const settings = await prisma.canteenSettings.findFirst()

  const categories = await prisma.menuCategory.findMany({
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  return NextResponse.json({
    data: {
      isOnline: settings?.isOnline ?? true,
      categories,
    },
  })
}

// Create menu item (canteen manager / admin)
async function postHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { name, description, price, categoryId, imageUrl, isSpecial } = body

  if (!name || !price || !categoryId) {
    return NextResponse.json({ error: 'Name, price, and category are required' }, { status: 400 })
  }

  const item = await prisma.menuItem.create({
    data: { name, description, price, categoryId, imageUrl, isSpecial: isSpecial ?? false },
  })

  return NextResponse.json({ data: item }, { status: 201 })
}

// Update menu item (mark sold out, edit, etc)
async function putHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { id, ...updates } = body

  const item = await prisma.menuItem.update({
    where: { id },
    data: updates,
  })

  return NextResponse.json({ data: item })
}

export const GET = getHandler
export const POST = requireAuth(postHandler, [Role.ADMIN, Role.COOK])
export const PUT = requireAuth(putHandler, [Role.ADMIN, Role.COOK])
