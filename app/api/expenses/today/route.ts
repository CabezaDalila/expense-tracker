import { NextRequest, NextResponse } from "next/server"
import { getExpiringToday } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      )
    }

    const todayExpenses = await getExpiringToday(userId)
    
    return NextResponse.json(todayExpenses)
  } catch (error) {
    console.error("Error fetching today's expenses:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
