import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function migrateToSpanish() {
  try {
    console.log("Starting migration to Spanish values...")
    
    // Drop existing constraints
    await sql`ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check`
    await sql`ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check`
    
    // Add temporary constraints that allow both old and new values
    await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('fixed', 'variable', 'credit_card', 'fijo', 'variable', 'tarjeta'))`
    await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_status_check CHECK (status IN ('pending', 'paid', 'pendiente', 'pagado'))`
    
    // Update existing data to Spanish values
    await sql`UPDATE expenses SET category = 'fijo' WHERE category = 'fixed'`
    await sql`UPDATE expenses SET category = 'tarjeta' WHERE category = 'credit_card'`
    await sql`UPDATE expenses SET status = 'pagado' WHERE status = 'paid'`
    await sql`UPDATE expenses SET status = 'pendiente' WHERE status = 'pending'`
    
    // Drop temporary constraints
    await sql`ALTER TABLE expenses DROP CONSTRAINT expenses_category_check`
    await sql`ALTER TABLE expenses DROP CONSTRAINT expenses_status_check`
    
    // Add final constraints with only Spanish values
    await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('fijo', 'variable', 'tarjeta'))`
    await sql`ALTER TABLE expenses ADD CONSTRAINT expenses_status_check CHECK (status IN ('pendiente', 'pagado'))`
    
    // Update default value for status
    await sql`ALTER TABLE expenses ALTER COLUMN status SET DEFAULT 'pendiente'`
    
    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}
