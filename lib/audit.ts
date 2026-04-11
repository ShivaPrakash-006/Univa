import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

interface AuditParams {
  userId: string
  action: string
  entity: string
  entityId?: string
  metadata?: Prisma.InputJsonValue
  ipAddress?: string
}

export async function createAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
      },
    })
  } catch (err) {
    console.error('Audit log error:', err)
  }
}

export const ACTIONS = {
  LOGIN: 'USER_LOGIN',
  LOGOUT: 'USER_LOGOUT',
  GRADE_CHANGE: 'GRADE_CHANGE',
  GRADE_LOCK: 'GRADE_LOCK',
  ATTENDANCE_MARK: 'ATTENDANCE_MARK',
  ATTENDANCE_EDIT: 'ATTENDANCE_EDIT',
  BOOK_CHECKOUT: 'BOOK_CHECKOUT',
  BOOK_RETURN: 'BOOK_RETURN',
  FINE_WAIVED: 'FINE_WAIVED',
  ORDER_PLACED: 'ORDER_PLACED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  USER_CREATED: 'USER_CREATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
} as const
