import { type NextRequest, NextResponse } from "next/server"
import { getExpenses, createExpense, type ExpenseInput } from "@/lib/database"
import { initializeDatabase } from "@/lib/init-database"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    // For now, using demo-user to match sample data - you'll integrate with Clerk later
    const userId = "demo-user"
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || undefined
    const month = searchParams.get('month') || undefined
    
    const expenses = await getExpenses(userId, year, month)
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const userId = "demo-user"
    const expenseData: ExpenseInput = await request.json()
    
    console.log("Creating expense with data:", expenseData)

    const newExpense = await createExpense(userId, expenseData)
    console.log("Expense created successfully:", newExpense)
    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    console.error("Error details:", error.message)
    return NextResponse.json({ error: "Failed to create expense", details: error.message }, { status: 500 })
  }
}
