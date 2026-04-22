import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

async function patchHandler(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  const { status, itemId, itemStatus, rejectionReason } = await request.json()
  const orderId = params.id

  const order = await prisma.canteenOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Cook can update item-level status
  if (itemId) {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: itemStatus, rejectionReason },
    })

    // If all items are done, update order status to READY_FOR_PICKUP
    const updatedItems = await prisma.orderItem.findMany({ where: { orderId } })
    const allDone = updatedItems.every(i => i.status === 'READY_FOR_PICKUP' || i.status === 'CANCELLED')
    if (allDone) {
      await prisma.canteenOrder.update({ where: { id: orderId }, data: { status: 'READY_FOR_PICKUP' } })
    }

    return NextResponse.json({ message: 'Item status updated' })
  }

  // Update order-level status
  const updated = await prisma.canteenOrder.update({
    where: { id: orderId },
    data: { status },
    include: { items: { include: { menuItem: true } } },
  })

  return NextResponse.json({ data: updated })
}

export const PATCH = requireAuth(patchHandler, [Role.COOK, Role.CANTEEN_SERVER, Role.ADMIN])
