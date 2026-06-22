import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getExpenseStats } from "@/lib/database"
import { initializeDatabase } from "@/lib/init-database"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!session.user.householdId) return NextResponse.json({ error: "Sin hogar configurado" }, { status: 403 })

  try {
    await initializeDatabase()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || undefined
    const month = searchParams.get("month") || undefined
    const stats = await getExpenseStats(session.user.householdId, year, month)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching expense stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
