import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function addNotesColumn() {
  try {
    console.log("Adding notes column to expenses table...")
    
    // Check if notes column exists
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' AND column_name = 'notes'
    `
    
    if (result.length === 0) {
      // Add notes column
      await sql`ALTER TABLE expenses ADD COLUMN notes TEXT`
      console.log("Notes column added successfully!")
    } else {
      console.log("Notes column already exists")
    }
  } catch (error) {
    console.error("Error adding notes column:", error)
    throw error
  }
}
