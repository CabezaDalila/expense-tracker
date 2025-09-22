import { NextResponse } from "next/server"
import { clearAllExpenses } from "@/lib/clear-database"

export async function DELETE() {
  try {
    const deletedCount = await clearAllExpenses()
    return NextResponse.json({ 
      message: "All expenses cleared successfully", 
      deletedCount 
    })
  } catch (error) {
    console.error("Error clearing expenses:", error)
    return NextResponse.json({ error: "Failed to clear expenses" }, { status: 500 })
  }
}
