import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, getDashboardPath } from "@/lib/auth";
import { createAuditLog, ACTIONS } from '@/lib/audit'

export async function POST( request: Request ) {
  const { collegeId, password } = await request.json()

  if (!collegeId || !password) {
    return NextResponse.json(
      { message: "ID and Password are required" },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({where: { collegeId }})

  if (!user || !user.isActive) {
    return NextResponse.json(
      { message: "User not Found" },
      { status: 400 }
    )
  }

  const valid = await comparePassword(password, user.passwordHash);
  if ( !valid ) {
    return NextResponse.json(
      { message: "Wrong Password" },
      { status: 400 }
    )
  }

  const token = signToken({
    userId: user.id,
    collegeId: user.collegeId,
    role: user.role,
    name: user.name,
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  await createAuditLog({
      userId: user.id,
      action: ACTIONS.LOGIN,
      entity: 'User',
      entityId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',

  })


  const redirectTo = getDashboardPath(user.role)

  const response = NextResponse.json({ redirectTo, role: user.role, name: user.name })
  response.cookies.set('univa_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  })

  return response

}
