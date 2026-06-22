import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!session.user.householdId) return NextResponse.json({ error: "Sin hogar" }, { status: 403 })

  const id = Number.parseInt(params.id)
  const [row] = await sql`
    SELECT receipt_data, receipt_name
    FROM expenses
    WHERE id = ${id} AND household_id = ${session.user.householdId}
  `

  if (!row?.receipt_data) {
    return NextResponse.json({ error: "Sin comprobante" }, { status: 404 })
  }

  return NextResponse.json({ data: row.receipt_data, name: row.receipt_name })
}
