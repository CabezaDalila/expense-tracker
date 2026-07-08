import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { initializeDatabase } from "@/lib/init-database"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json()
  const endpoint: string | undefined = body?.endpoint
  const p256dh: string | undefined = body?.keys?.p256dh
  const auth: string | undefined = body?.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
  }

  try {
    await initializeDatabase()
    const userAgent = request.headers.get("user-agent") || null
    // Si el endpoint ya existía (mismo browser volviendo a suscribirse), lo actualizamos.
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      VALUES (${session.user.id}, ${endpoint}, ${p256dh}, ${auth}, ${userAgent})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent
    `
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error guardando push subscription:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const endpoint: string | undefined = body?.endpoint
  if (!endpoint) return NextResponse.json({ error: "Falta endpoint" }, { status: 400 })

  try {
    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint} AND user_id = ${session.user.id}
    `
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error borrando push subscription:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
