import { neon } from "@neondatabase/serverless"
import { migrateToSpanish } from "./migrate-to-spanish"
import { addNotesColumn } from "./add-notes-column"
import { addPaymentCodeColumn } from "./add-payment-code-column"

const sql = neon(process.env.DATABASE_URL!)

export async function initializeDatabase() {
  try {
    // Check if expenses table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses'
      );
    `

    if (!result[0].exists) {
      console.log("[v0] Creating expenses table...")

      // Create expenses table
      await sql`
        CREATE TABLE expenses (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('fijo', 'variable', 'tarjeta')),
          status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
          due_date DATE NOT NULL,
          notes TEXT,
          payment_code TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Create indexes
      await sql`CREATE INDEX idx_expenses_user_id ON expenses(user_id)`
      await sql`CREATE INDEX idx_expenses_due_date ON expenses(due_date)`
      await sql`CREATE INDEX idx_expenses_category ON expenses(category)`

      // Insert sample data
      await sql`
        INSERT INTO expenses (user_id, description, amount, category, status, due_date) VALUES
        ('demo-user', 'Caece', 289200.00, 'fijo', 'pagado', '2025-01-01'),
        ('demo-user', 'Celus dali+ Mtv', 29000.00, 'fijo', 'pagado', '2025-01-01'),
        ('demo-user', 'ICBC', 512525.69, 'tarjeta', 'pagado', '2025-02-01'),
        ('demo-user', 'Galicia visa', 62405.99, 'tarjeta', 'pagado', '2025-05-01'),
        ('demo-user', 'BBVA manu', 89722.09, 'tarjeta', 'pagado', '2025-07-01'),
        ('demo-user', 'BBVA dali', 580591.72, 'tarjeta', 'pagado', '2025-07-01'),
        ('demo-user', 'Parquero', 35000.00, 'fijo', 'pagado', '2025-08-01'),
        ('demo-user', 'Cochera', 70000.00, 'fijo', 'pagado', '2025-10-01'),
        ('demo-user', 'Internet', 21905.00, 'fijo', 'pendiente', '2025-01-15'),
        ('demo-user', 'Luz', 30000.00, 'variable', 'pendiente', '2025-01-20'),
        ('demo-user', 'Country', 217468.59, 'fijo', 'pendiente', '2025-01-25'),
        ('demo-user', 'Seguro (BBVA D)', 33680.00, 'fijo', 'pendiente', '2025-02-01')
      `

      console.log("[v0] Database initialized successfully")
    } else {
      // Table exists, check if we need to migrate to Spanish values
      const sampleData = await sql`SELECT category, status FROM expenses LIMIT 1`
      if (sampleData.length > 0) {
        const { category, status } = sampleData[0]
        if (category === 'fixed' || status === 'paid') {
          console.log("[v0] Migrating existing data to Spanish values...")
          await migrateToSpanish()
        }
      }
      
      // Ensure notes column exists
      await addNotesColumn()
      
      // Ensure payment_code column exists
      await addPaymentCodeColumn()
    }
  } catch (error) {
    console.error("[v0] Error initializing database:", error)
    throw error
  }
}
