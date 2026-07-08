import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Se ejecuta una sola vez por instancia del servidor: guardamos la promesa
// para no repetir todos los CREATE/ALTER en cada request.
let initPromise: Promise<void> | null = null

export function initializeDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = runInit().catch((e) => {
      // Si falla, permitir reintentar en el próximo request
      initPromise = null
      throw e
    })
  }
  return initPromise
}

async function runInit() {
  try {
    // app_users table
    await sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // households table
    await sql`
      CREATE TABLE IF NOT EXISTS households (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // household_members table
    await sql`
      CREATE TABLE IF NOT EXISTS household_members (
        user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
        household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, household_id)
      )
    `

    // expenses table
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
        added_by TEXT,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('fijo', 'variable', 'tarjeta')),
        status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
        due_date DATE NOT NULL,
        notes TEXT,
        payment_code TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Add columns to existing expenses table if they don't exist yet
    await sql`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS household_id INTEGER REFERENCES households(id) ON DELETE CASCADE
    `.catch(() => {})

    await sql`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS added_by TEXT
    `.catch(() => {})

    // La tabla vieja tenía user_id TEXT NOT NULL — ya no se usa.
    // Quitamos la restricción NOT NULL para que los nuevos inserts (sin user_id) funcionen.
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN user_id DROP NOT NULL
    `.catch(() => {})

    // Comprobante de pago (imagen o PDF guardado como data URL en base64)
    await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_data TEXT`.catch(() => {})
    await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_name TEXT`.catch(() => {})

    // Factura (imagen o PDF guardado como data URL en base64)
    await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_data TEXT`.catch(() => {})
    await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_name TEXT`.catch(() => {})

    // push_subscriptions: cada dispositivo/navegador guarda su suscripción
    // Web Push (VAPID) para recibir notificaciones aunque la app esté cerrada.
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_household_id ON expenses(household_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)`
    await sql`CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id)`

  } catch (error) {
    console.error("[db] Error initializing database:", error)
    throw error
  }
}
