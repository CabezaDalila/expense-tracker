import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { initializeDatabase } from "@/lib/init-database"

const sql = neon(process.env.DATABASE_URL!)

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  await initializeDatabase()

  const { name } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre del hogar es requerido" }, { status: 400 })
  }

  // Check if user already has a household
  const [existing] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${session.user.id}
  `
  if (existing) {
    return NextResponse.json({ error: "Ya pertenecés a un hogar" }, { status: 400 })
  }

  let inviteCode = generateInviteCode()
  // Ensure uniqueness
  let attempts = 0
  while (attempts < 5) {
    const [conflict] = await sql`SELECT id FROM households WHERE invite_code = ${inviteCode}`
    if (!conflict) break
    inviteCode = generateInviteCode()
    attempts++
  }

  const [household] = await sql`
    INSERT INTO households (name, invite_code) VALUES (${name.trim()}, ${inviteCode}) RETURNING *
  `

  await sql`
    INSERT INTO household_members (user_id, household_id, role) VALUES (${session.user.id}, ${household.id}, 'owner')
  `

  return NextResponse.json({ household, inviteCode })
}
