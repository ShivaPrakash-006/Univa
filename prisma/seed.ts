import 'dotenv/config'
import { PrismaClient, Role, BookStatus } from '@prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10)

  // Admin
  await prisma.user.upsert({
    where: { collegeId: 'ADMIN001' },
    update: {},
    create: {
      collegeId: 'ADMIN001',
      email: 'admin@univa.edu',
      passwordHash: hash('Admin@123'),
      role: Role.ADMIN,
      name: 'System Administrator',
    },
  })

  // Professor
  const profUser = await prisma.user.upsert({
    where: { collegeId: 'PROF001' },
    update: {},
    create: {
      collegeId: 'PROF001',
      email: 'prof.shiva@univa.edu',
      passwordHash: hash('Prof@123'),
      role: Role.PROFESSOR,
      name: 'Dr. Shiva Prakash',
    },
  })
  await prisma.professor.upsert({
    where: { userId: profUser.id },
    update: {},
    create: {
      userId: profUser.id,
      department: 'Computer Science',
      designation: 'Associate Professor',
    },
  })

  // Student
  const stuUser = await prisma.user.upsert({
    where: { collegeId: 'STU001' },
    update: {},
    create: {
      collegeId: 'STU001',
      email: 'hari.r@univa.edu',
      passwordHash: hash('Student@123'),
      role: Role.STUDENT,
      name: 'Hari Haran',
      walletBalance: 500,
    },
  })
  const student = await prisma.student.upsert({
    where: { userId: stuUser.id },
    update: {},
    create: {
      userId: stuUser.id,
      batch: '2022-26',
      semester: 6,
      department: 'Computer Science',
      programName: 'B.Tech CSE',
    },
  })
  await prisma.libraryAccount.upsert({
    where: { studentId: student.id },
    update: {},
    create: { studentId: student.id },
  })

  // Librarian
  await prisma.user.upsert({
    where: { collegeId: 'LIB001' },
    update: {},
    create: {
      collegeId: 'LIB001',
      email: 'librarian@univa.edu',
      passwordHash: hash('Lib@123'),
      role: Role.LIBRARIAN,
      name: 'Dharshan',
    },
  })

  // Cook
  await prisma.user.upsert({
    where: { collegeId: 'COOK001' },
    update: {},
    create: {
      collegeId: 'COOK001',
      email: 'cook@univa.edu',
      passwordHash: hash('Cook@123'),
      role: Role.COOK,
      name: 'Kumar',
    },
  })

  // Canteen Server
  await prisma.user.upsert({
    where: { collegeId: 'SRV001' },
    update: {},
    create: {
      collegeId: 'SRV001',
      email: 'server@univa.edu',
      passwordHash: hash('Server@123'),
      role: Role.CANTEEN_SERVER,
      name: 'Devi',
    },
  })

  // Academic Term
  const term = await prisma.academicTerm.upsert({
    where: { id: 'term-2026-even' },
    update: {},
    create: {
      id: 'term-2026-even',
      name: 'Even Semester 2025-26',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-04-31'),
      isActive: true,
    },
  })

  // Professor record
  const prof = await prisma.professor.findUnique({ where: { userId: profUser.id } })
  if (prof) {
    // Courses
    const course = await prisma.course.upsert({
      where: { code: 'CS601' },
      update: {},
      create: {
        code: 'CS601',
        name: 'Database Management Systems',
        credits: 4,
        department: 'Computer Science',
        termId: term.id,
        professorId: prof.id,
      },
    })

    // Enrollment
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
      update: {},
      create: { studentId: student.id, courseId: course.id },
    })

    // Timetable
    await prisma.timetable.createMany({
      skipDuplicates: true,
      data: [
        { courseId: course.id, termId: term.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'LH-101' },
        { courseId: course.id, termId: term.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:00', room: 'LH-101' },
      ],
    })

    // Grade
    await prisma.grade.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
      update: {},
      create: {
        studentId: student.id,
        courseId: course.id,
        internalMarks: 38,
        midtermMarks: 42,
        practicalMarks: 47,
      },
    })
  }

  // Books
  const books = [
    { title: 'Database System Concepts', isbn: '9780078022159', authors: ['Silberschatz', 'Korth'], subject: 'Database', status: BookStatus.AVAILABLE },
    { title: 'Introduction to Algorithms', isbn: '9780262033848', authors: ['Cormen', 'Leiserson'], subject: 'Algorithms', status: BookStatus.AVAILABLE },
    { title: 'Operating System Concepts', isbn: '9781119800361', authors: ['Silberschatz'], subject: 'Operating Systems', status: BookStatus.ON_LOAN },
    { title: 'Computer Networks', isbn: '9780132126953', authors: ['Tanenbaum'], subject: 'Networking', status: BookStatus.REFERENCE_ONLY },
  ]
  for (const b of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: b,
    })
  }

  // Menu
  const catMains = await prisma.menuCategory.upsert({
    where: { name: 'Main Course' },
    update: {},
    create: { name: 'Main Course' },
  })
  const catSnacks = await prisma.menuCategory.upsert({
    where: { name: 'Snacks' },
    update: {},
    create: { name: 'Snacks' },
  })
  const catBeverages = await prisma.menuCategory.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages' },
  })

  const menuItems = [
    { name: 'Veg Thali', description: 'Dal, sabzi, roti, rice & pickle', price: 60, categoryId: catMains.id, isSpecial: true },
    { name: 'Chicken Biryani', description: 'Aromatic basmati rice with chicken', price: 90, categoryId: catMains.id },
    { name: 'Paneer Butter Masala', description: 'Creamy paneer in tomato gravy', price: 70, categoryId: catMains.id },
    { name: 'Masala Dosa', description: 'Crispy dosa with potato filling', price: 40, categoryId: catSnacks.id },
    { name: 'Samosa (2 pcs)', description: 'Fried pastry with spiced filling', price: 20, categoryId: catSnacks.id },
    { name: 'Tea', description: 'Hot ginger tea', price: 10, categoryId: catBeverages.id },
    { name: 'Cold Coffee', description: 'Blended iced coffee', price: 35, categoryId: catBeverages.id },
  ]
  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.name.toLowerCase().replace(/ /g, '-') },
      update: {},
      create: { id: item.name.toLowerCase().replace(/ /g, '-'), ...item },
    })
  }

  // Canteen Settings
  await prisma.canteenSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings', isOnline: true },
  })

  // Fee Payment for student
  await prisma.feePayment.create({
    data: {
      studentId: student.id,
      amount: 45000,
      description: 'Semester 4 Tuition Fee',
      status: 'DUE',
      dueDate: new Date('2025-08-15'),
    },
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
