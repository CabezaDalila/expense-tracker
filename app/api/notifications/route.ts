import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  try {
    const rows = (await sql`
      SELECT id, title, body, url, created_at, read_at
      FROM notification_log
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 30
    `) as unknown as { id: number; title: string; body: string; url: string | null; created_at: string; read_at: string | null }[]

    const unread = rows.filter((r) => !r.read_at).length
    return NextResponse.json({ items: rows, unread })
  } catch (error) {
    console.error("Error listando notificaciones:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
