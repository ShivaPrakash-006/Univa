import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import 'dotenv/config'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '15') * 60 * 1000

export interface TokenPayload {
  userId: string
  collegeId: string
  role: Role
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_TIMEOUT}ms` })
}


export function getDashboardPath(role: Role): string {
  const paths: Record<Role, string> = {
    STUDENT: '/dashboard/student',
    PROFESSOR: '/dashboard/professor',
    LIBRARIAN: '/dashboard/librarian',
    COOK: '/dashboard/cook',
    CANTEEN_SERVER: '/dashboard/server',
    ADMIN: '/dashboard/admin',
  }
  return paths[role]
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}
