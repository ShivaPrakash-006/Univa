// src/types/index.ts
import { Role, OrderStatus, BookStatus, AttendanceStatus, FeeStatus, PaymentStatus } from '@prisma/client'

export type { Role, OrderStatus, BookStatus, AttendanceStatus, FeeStatus, PaymentStatus }

export interface AuthUser {
  userId: string
  collegeId: string
  role: Role
  name: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface AttendanceSummary {
  courseId: string
  courseName: string
  courseCode: string
  totalClasses: number
  attended: number
  percentage: number
  isBelowThreshold: boolean
}

export interface GradeReport {
  courseId: string
  courseName: string
  courseCode: string
  internalMarks: number | null
  midtermMarks: number | null
  practicalMarks: number | null
  endSemMarks: number | null
  finalGrade: string | null
  isLocked: boolean
}

export interface LibraryFineConfig {
  finePerDay: number
  maxLoanDays: number
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name: string
    email: string
  }
  theme: { color: string }
}

export interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}
