import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createRazorpayOrder } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

async function postHandler(request: NextRequest, _: any, user: any) {
  const { type, referenceId, amount } = await request.json()
  // type: 'FEE' | 'CANTEEN' | 'WALLET_TOPUP'

  let finalAmount = amount
  let receipt = `${type}-${referenceId || Date.now()}`
  let notes: Record<string, string> = { type, userId: user.userId }

  if (type === 'FEE' && referenceId) {
    const fee = await prisma.feePayment.findUnique({ where: { id: referenceId } })
    if (!fee) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 })
    finalAmount = fee.amount
    notes.feeId = referenceId
  }

  if (type === 'CANTEEN' && referenceId) {
    const order = await prisma.canteenOrder.findUnique({ where: { id: referenceId } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    finalAmount = order.totalAmount
    notes.orderId = referenceId
  }

  const razorpayOrder = await createRazorpayOrder(finalAmount, receipt, notes)

  // Store razorpay order ID
  if (type === 'CANTEEN' && referenceId) {
    await prisma.canteenOrder.update({
      where: { id: referenceId },
      data: { razorpayOrderId: razorpayOrder.id },
    })
  } else if (type === 'FEE' && referenceId) {
    await prisma.feePayment.update({
      where: { id: referenceId },
      data: { razorpayOrderId: razorpayOrder.id },
    })
  }

  return NextResponse.json({
    data: {
      orderId: razorpayOrder.id,
      amount: finalAmount,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  })
}

export const POST = requireAuth(postHandler, [Role.STUDENT])
