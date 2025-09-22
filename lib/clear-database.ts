import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function clearAllExpenses() {
  try {
    console.log("Clearing all expenses from database...")
    
    // Delete all expenses
    const result = await sql`DELETE FROM expenses`
    
    console.log(`Deleted ${result.count} expenses from database`)
    return result.count
  } catch (error) {
    console.error("Error clearing database:", error)
    throw error
  }
}
