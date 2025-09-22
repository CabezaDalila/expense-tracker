import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Expense {
  id: number
  user_id: string
  description: string
  amount: number
  category: "fijo" | "variable" | "tarjeta"
  status: "pagado" | "pendiente"
  due_date: string
  notes?: string
  payment_code?: string
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
}

export async function getExpenses(userId: string, year?: string, month?: string): Promise<Expense[]> {
  let query = sql`
    SELECT * FROM expenses 
    WHERE user_id = ${userId}
  `
  
  if (year && month && month !== "all") {
    query = sql`
      SELECT * FROM expenses 
      WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM due_date) = ${parseInt(year)}
      AND EXTRACT(MONTH FROM due_date) = ${parseInt(month)}
    `
  } else if (year) {
    query = sql`
      SELECT * FROM expenses 
      WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM due_date) = ${parseInt(year)}
    `
  }
  
  const expenses = await sql`
    ${query}
    ORDER BY due_date ASC, created_at DESC
  `
  return expenses as Expense[]
}

export async function createExpense(userId: string, expense: ExpenseInput): Promise<Expense> {
  const [newExpense] = await sql`
    INSERT INTO expenses (user_id, description, amount, category, status, due_date, notes, payment_code)
    VALUES (${userId}, ${expense.description}, ${expense.amount}, ${expense.category}, ${expense.status}, ${expense.due_date}, ${expense.notes || null}, ${expense.payment_code || null})
    RETURNING *
  `
  
  // Si es un gasto fijo, crear réplicas según las opciones de propagación
  if (expense.category === "fijo" && expense.propagation_months) {
    const baseDate = new Date(expense.due_date + 'T00:00:00') // Asegurar que sea medianoche local
    
    // Determinar cuántos meses crear
    let monthsToCreate = 0
    if (expense.propagation_months === "indefinido") {
      monthsToCreate = 12 // Por defecto, crear 12 meses si es indefinido
    } else if (typeof expense.propagation_months === "number") {
      monthsToCreate = Math.max(0, Math.min(expense.propagation_months, 60)) // Máximo 60 meses
    }
    
    // Crear gastos para los meses especificados
    for (let i = 1; i <= monthsToCreate; i++) {
      const nextMonth = new Date(baseDate)
      nextMonth.setMonth(baseDate.getMonth() + i)
      
      // Formatear la fecha como YYYY-MM-DD
      const year = nextMonth.getFullYear()
      const month = String(nextMonth.getMonth() + 1).padStart(2, '0')
      const day = String(nextMonth.getDate()).padStart(2, '0')
      const nextMonthDate = `${year}-${month}-${day}`
      
      await sql`
        INSERT INTO expenses (user_id, description, amount, category, status, due_date, notes, payment_code)
        VALUES (${userId}, ${expense.description}, ${expense.amount}, ${expense.category}, 'pendiente', ${nextMonthDate}, ${expense.notes || null}, ${expense.payment_code || null})
      `
    }
  }
  
  return newExpense as Expense
}

export async function updateExpense(id: number, userId: string, expense: Partial<ExpenseInput>): Promise<Expense> {
  const [updatedExpense] = await sql`
    UPDATE expenses 
    SET 
      description = COALESCE(${expense.description}, description),
      amount = COALESCE(${expense.amount}, amount),
      category = COALESCE(${expense.category}, category),
      status = COALESCE(${expense.status}, status),
      due_date = COALESCE(${expense.due_date}, due_date),
      notes = COALESCE(${expense.notes}, notes),
      payment_code = COALESCE(${expense.payment_code}, payment_code),
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return updatedExpense as Expense
}

export async function deleteExpense(id: number, userId: string): Promise<void> {
  await sql`
    DELETE FROM expenses 
    WHERE id = ${id} AND user_id = ${userId}
  `
}

export async function getExpenseStats(userId: string, year?: string, month?: string) {
  let whereClause = sql`WHERE user_id = ${userId}`
  
  if (year && month && month !== "all") {
    whereClause = sql`
      WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM due_date) = ${parseInt(year)}
      AND EXTRACT(MONTH FROM due_date) = ${parseInt(month)}
    `
  } else if (year) {
    whereClause = sql`
      WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM due_date) = ${parseInt(year)}
    `
  }
  
  const [stats] = await sql`
    SELECT 
      COUNT(*) as total_expenses,
      SUM(CASE WHEN status = 'pagado' THEN amount ELSE 0 END) as total_paid,
      SUM(CASE WHEN status = 'pendiente' THEN amount ELSE 0 END) as total_pending,
      SUM(CASE WHEN category = 'fijo' THEN amount ELSE 0 END) as total_fixed,
      SUM(CASE WHEN category = 'variable' THEN amount ELSE 0 END) as total_variable,
      SUM(CASE WHEN category = 'tarjeta' THEN amount ELSE 0 END) as total_cards,
      COUNT(CASE WHEN status = 'pendiente' AND due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as upcoming_due
    FROM expenses 
    ${whereClause}
  `
  return {
    totalExpenses: Number.parseInt(stats.total_expenses),
    totalPaid: Number.parseFloat(stats.total_paid || "0"),
    totalPending: Number.parseFloat(stats.total_pending || "0"),
    totalFixed: Number.parseFloat(stats.total_fixed || "0"),
    totalVariable: Number.parseFloat(stats.total_variable || "0"),
    totalCards: Number.parseFloat(stats.total_cards || "0"),
    upcomingDue: Number.parseInt(stats.upcoming_due),
  }
}
