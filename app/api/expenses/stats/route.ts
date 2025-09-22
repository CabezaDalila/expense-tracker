import { type NextRequest, NextResponse } from "next/server"
import { getExpenseStats } from "@/lib/database"
import { initializeDatabase } from "@/lib/init-database"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const userId = "demo-user"
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || undefined
    const month = searchParams.get('month') || undefined
    
    const stats = await getExpenseStats(userId, year, month)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching expense stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
