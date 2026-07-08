import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Expense {
  id: number
  household_id: number
  added_by: string
  added_by_name?: string
  description: string
  amount: number
  category: "fijo" | "variable" | "tarjeta"
  status: "pagado" | "pendiente"
  due_date: string
  notes?: string
  payment_code?: string
  receipt_data?: string
  receipt_name?: string
  has_receipt?: boolean
  invoice_data?: string
  invoice_name?: string
  has_invoice?: boolean
  created_at: string
  updated_at: string
}

export interface ExpenseInput {
  description: string
  amount: number
  category: "fijo" | "variable" | "tarjeta"
  status: "pagado" | "pendiente"
  due_date: string
  notes?: string
  propagation_months?: number | "indefinido"
  payment_code?: string
  receipt_data?: string | null
  receipt_name?: string | null
  invoice_data?: string | null
  invoice_name?: string | null
}

export async function getExpenses(householdId: number, year?: string, month?: string): Promise<Expense[]> {
  let rows: Record<string, any>[]
  if (year && month && month !== "all") {
    rows = await sql`
      SELECT e.id, e.household_id, e.added_by, e.description, e.amount, e.category, e.status, e.due_date, e.notes, e.payment_code, e.receipt_name, (e.receipt_data IS NOT NULL) AS has_receipt, e.invoice_name, (e.invoice_data IS NOT NULL) AS has_invoice, e.created_at, e.updated_at, u.name as added_by_name
      FROM expenses e
      LEFT JOIN app_users u ON u.id = e.added_by
      WHERE e.household_id = ${householdId}
      AND EXTRACT(YEAR FROM e.due_date) = ${parseInt(year)}
      AND EXTRACT(MONTH FROM e.due_date) = ${parseInt(month)}
      ORDER BY e.due_date ASC, e.created_at DESC
    `
  } else if (year) {
    rows = await sql`
      SELECT e.id, e.household_id, e.added_by, e.description, e.amount, e.category, e.status, e.due_date, e.notes, e.payment_code, e.receipt_name, (e.receipt_data IS NOT NULL) AS has_receipt, e.invoice_name, (e.invoice_data IS NOT NULL) AS has_invoice, e.created_at, e.updated_at, u.name as added_by_name
      FROM expenses e
      LEFT JOIN app_users u ON u.id = e.added_by
      WHERE e.household_id = ${householdId}
      AND EXTRACT(YEAR FROM e.due_date) = ${parseInt(year)}
      ORDER BY e.due_date ASC, e.created_at DESC
    `
  } else {
    rows = await sql`
      SELECT e.id, e.household_id, e.added_by, e.description, e.amount, e.category, e.status, e.due_date, e.notes, e.payment_code, e.receipt_name, (e.receipt_data IS NOT NULL) AS has_receipt, e.invoice_name, (e.invoice_data IS NOT NULL) AS has_invoice, e.created_at, e.updated_at, u.name as added_by_name
      FROM expenses e
      LEFT JOIN app_users u ON u.id = e.added_by
      WHERE e.household_id = ${householdId}
      ORDER BY e.due_date ASC, e.created_at DESC
    `
  }
  return rows as unknown as Expense[]
}

export async function createExpense(householdId: number, addedBy: string, expense: ExpenseInput): Promise<Expense> {
  const [newExpense] = await sql`
    INSERT INTO expenses (household_id, added_by, description, amount, category, status, due_date, notes, payment_code, receipt_data, receipt_name, invoice_data, invoice_name)
    VALUES (${householdId}, ${addedBy}, ${expense.description}, ${expense.amount}, ${expense.category}, ${expense.status}, ${expense.due_date}, ${expense.notes || null}, ${expense.payment_code || null}, ${expense.receipt_data || null}, ${expense.receipt_name || null}, ${expense.invoice_data || null}, ${expense.invoice_name || null})
    RETURNING id, household_id, added_by, description, amount, category, status, due_date, notes, payment_code, receipt_name, (receipt_data IS NOT NULL) AS has_receipt, invoice_name, (invoice_data IS NOT NULL) AS has_invoice, created_at, updated_at
  `

  if (expense.category === "fijo" && expense.propagation_months) {
    const baseDate = new Date(expense.due_date + "T00:00:00")

    let monthsToCreate = 0
    if (expense.propagation_months === "indefinido") {
      monthsToCreate = 12
    } else {
      monthsToCreate = Math.max(0, Math.min(expense.propagation_months, 60))
    }

    for (let i = 1; i <= monthsToCreate; i++) {
      const nextMonth = new Date(baseDate)
      nextMonth.setMonth(baseDate.getMonth() + i)

      const year = nextMonth.getFullYear()
      const month = String(nextMonth.getMonth() + 1).padStart(2, "0")
      const day = String(nextMonth.getDate()).padStart(2, "0")
      const nextMonthDate = `${year}-${month}-${day}`

      await sql`
        INSERT INTO expenses (household_id, added_by, description, amount, category, status, due_date, notes, payment_code)
        VALUES (${householdId}, ${addedBy}, ${expense.description}, ${expense.amount}, ${expense.category}, 'pendiente', ${nextMonthDate}, ${expense.notes || null}, ${expense.payment_code || null})
      `
    }
  }

  return newExpense as Expense
}

export async function updateExpense(id: number, householdId: number, expense: Partial<ExpenseInput>): Promise<Expense> {
  const [updatedExpense] = await sql`
    UPDATE expenses
    SET
      description = COALESCE(${expense.description ?? null}, description),
      amount = COALESCE(${expense.amount ?? null}, amount),
      category = COALESCE(${expense.category ?? null}, category),
      status = COALESCE(${expense.status ?? null}, status),
      due_date = COALESCE(${expense.due_date ?? null}, due_date),
      notes = COALESCE(${expense.notes ?? null}, notes),
      payment_code = COALESCE(${expense.payment_code ?? null}, payment_code),
      receipt_data = COALESCE(${expense.receipt_data ?? null}, receipt_data),
      receipt_name = COALESCE(${expense.receipt_name ?? null}, receipt_name),
      invoice_data = COALESCE(${expense.invoice_data ?? null}, invoice_data),
      invoice_name = COALESCE(${expense.invoice_name ?? null}, invoice_name),
      updated_at = NOW()
    WHERE id = ${id} AND household_id = ${householdId}
    RETURNING id, household_id, added_by, description, amount, category, status, due_date, notes, payment_code, receipt_name, (receipt_data IS NOT NULL) AS has_receipt, invoice_name, (invoice_data IS NOT NULL) AS has_invoice, created_at, updated_at
  `
  return updatedExpense as Expense
}

export async function deleteExpense(id: number, householdId: number): Promise<void> {
  await sql`
    DELETE FROM expenses
    WHERE id = ${id} AND household_id = ${householdId}
  `
}

export async function getExpenseStats(householdId: number, year?: string, month?: string) {
  let stats: any[]

  if (year && month && month !== "all") {
    stats = await sql`
      SELECT
        COUNT(*) as total_expenses,
        SUM(CASE WHEN status = 'pagado' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pendiente' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN category = 'fijo' THEN amount ELSE 0 END) as total_fixed,
        SUM(CASE WHEN category = 'variable' THEN amount ELSE 0 END) as total_variable,
        SUM(CASE WHEN category = 'tarjeta' THEN amount ELSE 0 END) as total_cards,
        COUNT(CASE WHEN status = 'pendiente' AND due_date <= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date + INTERVAL '7 days' THEN 1 END) as upcoming_due
      FROM expenses
      WHERE household_id = ${householdId}
      AND EXTRACT(YEAR FROM due_date) = ${parseInt(year)}
      AND EXTRACT(MONTH FROM due_date) = ${parseInt(month)}
    `
  } else if (year) {
    stats = await sql`
      SELECT
        COUNT(*) as total_expenses,
        SUM(CASE WHEN status = 'pagado' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pendiente' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN category = 'fijo' THEN amount ELSE 0 END) as total_fixed,
        SUM(CASE WHEN category = 'variable' THEN amount ELSE 0 END) as total_variable,
        SUM(CASE WHEN category = 'tarjeta' THEN amount ELSE 0 END) as total_cards,
        COUNT(CASE WHEN status = 'pendiente' AND due_date <= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date + INTERVAL '7 days' THEN 1 END) as upcoming_due
      FROM expenses
      WHERE household_id = ${householdId}
      AND EXTRACT(YEAR FROM due_date) = ${parseInt(year)}
    `
  } else {
    stats = await sql`
      SELECT
        COUNT(*) as total_expenses,
        SUM(CASE WHEN status = 'pagado' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pendiente' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN category = 'fijo' THEN amount ELSE 0 END) as total_fixed,
        SUM(CASE WHEN category = 'variable' THEN amount ELSE 0 END) as total_variable,
        SUM(CASE WHEN category = 'tarjeta' THEN amount ELSE 0 END) as total_cards,
        COUNT(CASE WHEN status = 'pendiente' AND due_date <= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date + INTERVAL '7 days' THEN 1 END) as upcoming_due
      FROM expenses
      WHERE household_id = ${householdId}
    `
  }

  const stat = stats[0]
  return {
    totalExpenses: Number.parseInt(stat.total_expenses),
    totalPaid: Number.parseFloat(stat.total_paid || "0"),
    totalPending: Number.parseFloat(stat.total_pending || "0"),
    totalFixed: Number.parseFloat(stat.total_fixed || "0"),
    totalVariable: Number.parseFloat(stat.total_variable || "0"),
    totalCards: Number.parseFloat(stat.total_cards || "0"),
    upcomingDue: Number.parseInt(stat.upcoming_due),
  }
}

export async function getExpiringToday(householdId: number): Promise<Expense[]> {
  const rows = await sql`
    SELECT e.id, e.household_id, e.added_by, e.description, e.amount, e.category, e.status, e.due_date, e.notes, e.payment_code, e.receipt_name, (e.receipt_data IS NOT NULL) AS has_receipt, e.invoice_name, (e.invoice_data IS NOT NULL) AS has_invoice, e.created_at, e.updated_at, u.name as added_by_name
    FROM expenses e
    LEFT JOIN app_users u ON u.id = e.added_by
    WHERE e.household_id = ${householdId}
    AND e.status = 'pendiente'
    AND e.due_date = (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
    ORDER BY e.amount DESC
  `
  return rows as unknown as Expense[]
}

export async function getExpiringTomorrow(householdId: number): Promise<Expense[]> {
  const rows = await sql`
    SELECT e.id, e.household_id, e.added_by, e.description, e.amount, e.category, e.status, e.due_date, e.notes, e.payment_code, e.receipt_name, (e.receipt_data IS NOT NULL) AS has_receipt, e.invoice_name, (e.invoice_data IS NOT NULL) AS has_invoice, e.created_at, e.updated_at, u.name as added_by_name
    FROM expenses e
    LEFT JOIN app_users u ON u.id = e.added_by
    WHERE e.household_id = ${householdId}
    AND e.status = 'pendiente'
    AND e.due_date = (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date + INTERVAL '1 day'
    ORDER BY e.amount DESC
  `
  return rows as unknown as Expense[]
}
