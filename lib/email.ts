// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  })
}

export async function sendBookDueReminder(studentEmail: string, studentName: string, bookTitle: string, dueDate: Date) {
  const dueDateStr = dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  await sendEmail(
    studentEmail,
    `📚 Book Due Tomorrow: ${bookTitle}`,
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Univa Library Reminder</h2>
      <p>Dear ${studentName},</p>
      <p>This is a reminder that your borrowed book <strong>"${bookTitle}"</strong> is due for return tomorrow, <strong>${dueDateStr}</strong>.</p>
      <p>Please return the book to avoid overdue fines.</p>
      <p style="color: #666;">Thank you,<br/>Univa Library Team</p>
    </div>
    `
  )
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
  await sendEmail(
    email,
    'Univa - Password Reset Request',
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Password Reset</h2>
      <p>Dear ${name},</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Reset Password</a>
      <p style="color:#666;">If you did not request this, please ignore this email.</p>
    </div>
    `
  )
}

export async function sendOrderStatusUpdate(studentEmail: string, studentName: string, orderNumber: string, status: string) {
  await sendEmail(
    studentEmail,
    `Univa Canteen - Order #${orderNumber} Update`,
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Order Status Update</h2>
      <p>Dear ${studentName},</p>
      <p>Your order <strong>#${orderNumber}</strong> status has been updated to: <strong>${status}</strong></p>
      <p style="color: #666;">Thank you for ordering at Univa Canteen!</p>
    </div>
    `
  )
}
