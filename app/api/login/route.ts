import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST( req: Request ) {
  const { id, passwd } = await req.json()

  console.log(id)
  console.log(passwd)
  if (!id || !passwd) {
      console.log("Hello")
    return NextResponse.json(
      { message: "Missing Fields" },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({where: { id:Number(id) }})

  if (!user) {
    return NextResponse.json(
      { message: "User not Found" },
      { status: 401 }
    )
  }

  if ( user.password !== passwd ) {
    return NextResponse.json(
      { message: "Wrong Password" },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
