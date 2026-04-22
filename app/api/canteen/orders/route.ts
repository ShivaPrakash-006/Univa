import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, ACTIONS } from '@/lib/audit'
import { Role } from '@prisma/client'
import QRCode from 'qrcode'

// Place order (Student)
async function postHandler(request: NextRequest, _: any, user: any) {
  const body = await request.json()
  const { items, orderType, specialInstructions, paymentMethod } = body
  // items: Array<{ menuItemId: string; quantity: number }>

  const settings = await prisma.canteenSettings.findFirst()
  if (!settings?.isOnline) {
    return NextResponse.json({ error: 'Canteen is currently offline' }, { status: 503 })
  }

  if (!items?.length) return NextResponse.json({ error: 'No items in order' }, { status: 400 })

  // Fetch menu items and validate availability
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i: any) => i.menuItemId) } },
  })

  for (const item of items) {
    const menuItem = menuItems.find(m => m.id === item.menuItemId)
    if (!menuItem) return NextResponse.json({ error: `Item not found: ${item.menuItemId}` }, { status: 404 })
    if (menuItem.isSoldOut || !menuItem.isAvailable) {
      return NextResponse.json({ error: `${menuItem.name} is not available` }, { status: 409 })
    }
  }

  // Calculate total
  const totalAmount = items.reduce((sum: number, item: any) => {
    const menuItem = menuItems.find(m => m.id === item.menuItemId)!
    return sum + menuItem.price * item.quantity
  }, 0)

  // Campus wallet payment
  if (paymentMethod === 'wallet') {
    const userRecord = await prisma.user.findUnique({ where: { id: user.userId } })
    if (!userRecord || userRecord.walletBalance < totalAmount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 402 })
    }
  }

  const order = await prisma.canteenOrder.create({
    data: {
      userId: user.userId,
      orderType: orderType || 'TAKEAWAY',
      totalAmount,
      specialInstructions,
      paymentStatus: paymentMethod === 'wallet' ? 'PAID' : 'PENDING',
      items: {
        create: items.map((item: any) => {
          const menuItem = menuItems.find(m => m.id === item.menuItemId)!
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
          }
        }),
      },
    },
    include: { items: { include: { menuItem: true } } },
  })

  // Generate QR code for dine-in orders
  if (orderType === 'DINE_IN') {
    const qrCode = await QRCode.toDataURL(order.confirmationNumber)
    await prisma.canteenOrder.update({
      where: { id: order.id },
      data: { qrCode },
    })
  }

  // Deduct wallet balance
  if (paymentMethod === 'wallet') {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.userId },
        data: { walletBalance: { decrement: totalAmount } },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: user.userId,
          amount: totalAmount,
          type: 'DEBIT',
          description: `Canteen order #${order.confirmationNumber}`,
          reference: order.id,
        },
      }),
    ])
  }

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.ORDER_PLACED,
    entity: 'CanteenOrder',
    entityId: order.id,
    metadata: { totalAmount, itemCount: items.length },
  })

  return NextResponse.json({ data: order }, { status: 201 })
}

// Get orders - role-based
async function getHandler(request: NextRequest, _: any, user: any) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let orders

  if (user.role === Role.STUDENT) {
    orders = await prisma.canteenOrder.findMany({
      where: { userId: user.userId },
      include: { items: { include: { menuItem: true } } },
      orderBy: { placedAt: 'desc' },
      take: 20,
    })
  } else if (user.role === Role.COOK || user.role === Role.CANTEEN_SERVER) {
    orders = await prisma.canteenOrder.findMany({
      where: status ? { status: status as any } : { status: { in: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] } },
      include: {
        items: { include: { menuItem: true } },
        user: { select: { name: true, collegeId: true } },
      },
      orderBy: { placedAt: 'asc' },
    })
  } else {
    orders = await prisma.canteenOrder.findMany({
      include: {
        items: { include: { menuItem: true } },
        user: { select: { name: true, collegeId: true } },
      },
      orderBy: { placedAt: 'desc' },
      take: 50,
    })
  }

  return NextResponse.json({ data: orders })
}

export const POST = requireAuth(postHandler, [Role.STUDENT])
export const GET = requireAuth(getHandler)
