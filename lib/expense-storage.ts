export interface Expense {
  id: string
  description: string
  amount: number
  category: "fixed" | "variable" | "credit-card"
  status: "paid" | "pending" | "overdue"
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseCategory {
  id: string
  name: string
  type: "fixed" | "variable" | "credit-card"
  color: string
}

const STORAGE_KEYS = {
  EXPENSES: "expense-tracker-expenses",
  CATEGORIES: "expense-tracker-categories",
  NOTIFICATIONS: "expense-tracker-notifications",
}

// Default categories based on the Excel data
const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: "1", name: "Casa Country", type: "fixed", color: "#10b981" },
  { id: "2", name: "Servicios", type: "fixed", color: "#3b82f6" },
  { id: "3", name: "Tarjetas de Crédito", type: "credit-card", color: "#f59e0b" },
  { id: "4", name: "Gastos Variables", type: "variable", color: "#8b5cf6" },
  { id: "5", name: "Seguros", type: "fixed", color: "#ef4444" },
]

export const expenseStorage = {
  getExpenses(): Expense[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES)
    return stored ? JSON.parse(stored) : []
  },

  saveExpenses(expenses: Expense[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses))
  },

  addExpense(expense: Omit<Expense, "id" | "createdAt" | "updatedAt">): Expense {
    const expenses = this.getExpenses()
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expenses.push(newExpense)
    this.saveExpenses(expenses)
    return newExpense
  },

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const expenses = this.getExpenses()
    const index = expenses.findIndex((e) => e.id === id)
    if (index === -1) return null

    expenses[index] = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveExpenses(expenses)
    return expenses[index]
  },

  deleteExpense(id: string): boolean {
    const expenses = this.getExpenses()
    const filtered = expenses.filter((e) => e.id !== id)
    if (filtered.length === expenses.length) return false
    this.saveExpenses(filtered)
    return true
  },

  getCategories(): ExpenseCategory[] {
    if (typeof window === "undefined") return DEFAULT_CATEGORIES
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES
  },

  saveCategories(categories: ExpenseCategory[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
  },

  getUpcomingDueDates(): Expense[] {
    const expenses = this.getExpenses()
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return expenses.filter((expense) => {
      if (expense.status === "paid") return false
      const dueDate = new Date(expense.dueDate)
      return dueDate >= today && dueDate <= nextWeek
    })
  },
}
