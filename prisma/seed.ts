import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
})

const userData = {
  id: 0,
  email: "admin@gmail.com",
  password: "admin"
}

export async function main() {
  await prisma.user.create({ data: userData });
}

main();
