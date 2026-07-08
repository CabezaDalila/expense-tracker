import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  try {
    await sql`
      UPDATE notification_log
      SET read_at = NOW()
      WHERE user_id = ${session.user.id} AND read_at IS NULL
    `
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error marcando notificaciones como leídas:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
