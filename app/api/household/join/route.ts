import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { initializeDatabase } from "@/lib/init-database"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  await initializeDatabase()

  const { inviteCode } = await request.json()
  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: "Código de invitación requerido" }, { status: 400 })
  }

  // Check if user already has a household
  const [existing] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${session.user.id}
  `
  if (existing) {
    return NextResponse.json({ error: "Ya pertenecés a un hogar" }, { status: 400 })
  }

  const [household] = await sql`
    SELECT * FROM households WHERE invite_code = ${inviteCode.trim().toUpperCase()}
  `
  if (!household) {
    return NextResponse.json({ error: "Código de invitación inválido" }, { status: 404 })
  }

  await sql`
    INSERT INTO household_members (user_id, household_id, role) VALUES (${session.user.id}, ${household.id}, 'member')
    ON CONFLICT DO NOTHING
  `

  return NextResponse.json({ household })
}
