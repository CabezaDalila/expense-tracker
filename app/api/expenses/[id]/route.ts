import { type NextRequest, NextResponse } from "next/server"
import { updateExpense, deleteExpense, type ExpenseInput } from "@/lib/database"
import { initializeDatabase } from "@/lib/init-database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase()

    const userId = "demo-user"
    const expenseId = Number.parseInt(params.id)
    const expenseData: Partial<ExpenseInput> = await request.json()

    const updatedExpense = await updateExpense(expenseId, userId, expenseData)
    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase()

    const userId = "demo-user"
    const expenseId = Number.parseInt(params.id)

    await deleteExpense(expenseId, userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
