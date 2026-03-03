'use client'

import prisma from "@/lib/prisma"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter()

  const [id, setId] = useState("")
  const [passwd, setPasswd] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

  console.log(id)
  console.log(passwd)
    const request = await fetch("/api/login", { method: "POST",
                                              headers: {"Content-Type": "application/json"}, 
                                              body: JSON.stringify({ id, passwd })});

    if (!request.ok) {
      return
    }
    const data = await request.json()

    if (!request.ok) {
      alert(data.message)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>ID</label>
          <input id="id" name="id" type="text" onChange={(event) => setId(event.target.value)}/>
        </div>
        <div>
          <label>Password</label>
          <input id="passwd" name="passwd" type="password" onChange={(event) => setPasswd(event.target.value)}/>
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  )
}
