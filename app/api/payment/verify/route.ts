import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import { createAuditLog, ACTIONS } from '@/lib/audit'

async function postHandler(request: NextRequest, _: any, user: any) {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    type,
    referenceId,
    amount,
  } = await request.json()

  const isValid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })
  if (!isValid) {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  if (type === 'CANTEEN' && referenceId) {
    await prisma.canteenOrder.update({
      where: { id: referenceId },
      data: { paymentStatus: 'PAID', razorpayPaymentId },
    })
  } else if (type === 'FEE' && referenceId) {
    await prisma.feePayment.update({
      where: { id: referenceId },
      data: { status: 'PAID', paidAt: new Date(), razorpayPaymentId },
    })
  } else if (type === 'WALLET_TOPUP') {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.userId },
        data: { walletBalance: { increment: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: user.userId,
          amount,
          type: 'CREDIT',
          description: 'Wallet top-up via Razorpay',
          reference: razorpayPaymentId,
        },
      }),
    ])
  }

  await createAuditLog({
    userId: user.userId,
    action: ACTIONS.PAYMENT_SUCCESS,
    entity: type,
    entityId: referenceId,
    metadata: { razorpayPaymentId, amount },
  })

  return NextResponse.json({ message: 'Payment verified successfully' })
}

export const POST = requireAuth(postHandler)
