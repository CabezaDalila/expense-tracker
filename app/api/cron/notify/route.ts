import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendToSubscription, type StoredSubscription } from "@/lib/push"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Vercel Cron incluye este header cuando CRON_SECRET está en las envs.
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // Todas las suscripciones activas
    const subs = (await sql`
      SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions
    `) as unknown as StoredSubscription[]

    if (subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "Sin suscripciones" })
    }

    // Para cada suscripción, resolvemos household y gastos pendientes vencidos o
    // por vencer (mañana incluido). Todos los que quedan pendientes vuelven a
    // sonar en el próximo cron, hasta que los marquen como pagados.
    const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
    let sent = 0
    for (const sub of subs) {
      const [member] = (await sql`
        SELECT household_id FROM household_members WHERE user_id = ${sub.user_id} LIMIT 1
      `) as unknown as { household_id: number | null }[]
      const householdId = member?.household_id
      if (!householdId) continue

      const rows = (await sql`
        SELECT description, amount, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date
        FROM expenses
        WHERE household_id = ${householdId}
          AND status = 'pendiente'
          AND due_date <= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date + INTERVAL '1 day'
        ORDER BY due_date ASC
      `) as unknown as { description: string; amount: string | number; due_date: string }[]

      if (rows.length === 0) continue

      const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
      today.setHours(0, 0, 0, 0)
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

      const totalAmount = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
      const overdueCount = rows.filter((r) => r.due_date < todayStr).length
      const todayCount = rows.filter((r) => r.due_date === todayStr).length
      const tomorrowCount = rows.length - overdueCount - todayCount

      let title: string
      let body: string
      if (rows.length === 1) {
        const r = rows[0]
        const when = r.due_date < todayStr ? "vencido" : r.due_date === todayStr ? "vence hoy" : "vence mañana"
        title = `Gasto ${when}: ${r.description}`
        body = fmt.format(Number(r.amount) || 0)
      } else {
        title = `${rows.length} gastos por pagar · ${fmt.format(totalAmount)}`
        const parts: string[] = []
        if (overdueCount) parts.push(`${overdueCount} vencido${overdueCount > 1 ? "s" : ""}`)
        if (todayCount) parts.push(`${todayCount} hoy`)
        if (tomorrowCount) parts.push(`${tomorrowCount} mañana`)
        body = parts.join(" · ")
      }

      const ok = await sendToSubscription(sub, { title, body, url: "/", tag: "expense-reminder" })
      if (ok) sent++
    }

    return NextResponse.json({ ok: true, subscriptions: subs.length, sent })
  } catch (error) {
    console.error("[cron/notify] Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
