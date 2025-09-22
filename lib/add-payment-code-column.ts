import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function addPaymentCodeColumn() {
  try {
    console.log("Adding payment_code column to expenses table...")
    
    // Verificar si la columna ya existe
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' 
      AND column_name = 'payment_code'
    `
    
    if (columnExists.length > 0) {
      console.log("Payment code column already exists")
      return
    }
    
    // Agregar la columna
    await sql`
      ALTER TABLE expenses 
      ADD COLUMN payment_code TEXT
    `
    
    console.log("Payment code column added successfully")
  } catch (error) {
    console.error("Error adding payment code column:", error)
    throw error
  }
}
