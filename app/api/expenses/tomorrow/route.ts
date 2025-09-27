import { NextRequest, NextResponse } from "next/server"
import { getExpiringTomorrow } from "@/lib/database"

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

    const tomorrowExpenses = await getExpiringTomorrow(userId)
    
    return NextResponse.json(tomorrowExpenses)
  } catch (error) {
    console.error("Error fetching tomorrow's expenses:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
