import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getExpiringTomorrow } from "@/lib/database"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (!session.user.householdId) return NextResponse.json([], { status: 200 })

  try {
    const expenses = await getExpiringTomorrow(session.user.householdId)
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching tomorrow's expenses:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
