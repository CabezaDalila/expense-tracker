import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const [row] = await sql`
    SELECT h.*, hm.role,
      (SELECT json_agg(json_build_object('name', u.name, 'email', u.email, 'image', u.image, 'role', m.role))
       FROM household_members m JOIN app_users u ON u.id = m.user_id
       WHERE m.household_id = h.id) as members
    FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${session.user.id}
    LIMIT 1
  `

  return NextResponse.json(row ?? null)
}
