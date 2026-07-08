import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, verifyIngestToken } from "@/lib/auth"
import { getExpenses, createExpense, findDuplicateExpense, type ExpenseInput } from "@/lib/database"
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
    const expenses = await getExpenses(session.user.householdId, year, month)
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Autenticación: token de ingreso (agente automático) o sesión de Google (UI).
  const ingest = verifyIngestToken(request)
  let householdId: number
  let userId: string

  if (ingest) {
    householdId = ingest.householdId
    userId = ingest.userId
  } else {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    if (!session.user.householdId) return NextResponse.json({ error: "Sin hogar configurado" }, { status: 403 })
    householdId = session.user.householdId
    userId = session.user.id
  }

  try {
    await initializeDatabase()
    const expenseData: ExpenseInput = await request.json()

    if (ingest) {
      // Validación mínima para el ingreso externo.
      const { description, amount, category, status, due_date } = expenseData
      if (!description || typeof amount !== "number" || !category || !status || !due_date) {
        return NextResponse.json(
          { error: "Faltan campos requeridos: description, amount, category, status, due_date" },
          { status: 400 },
        )
      }
      // Idempotencia: si ya existe un gasto igual, no lo duplicamos.
      const dup = await findDuplicateExpense(householdId, description, amount, due_date)
      if (dup) return NextResponse.json({ ...dup, duplicate: true }, { status: 200 })
    }

    const newExpense = await createExpense(householdId, userId, expenseData)
    return NextResponse.json(newExpense, { status: 201 })
  } catch (error: any) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense", details: error.message }, { status: 500 })
  }
}
