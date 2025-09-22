"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CreditCard, Calendar, AlertTriangle, TrendingUp, TrendingDown, Copy } from "lucide-react"
import type { Expense } from "@/lib/database"

interface ExpenseDashboardProps {
  expenses: Expense[]
  stats: {
    totalExpenses: number
    totalPaid: number
    totalPending: number
    totalFixed: number
    totalVariable: number
    totalCards: number
    upcomingDue: number
  }
}

export function ExpenseDashboard({ 
  expenses, 
  stats
}: ExpenseDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const paidExpensesCount = expenses.filter((e) => e.status === "pagado").length
  const pendingExpensesCount = expenses.filter((e) => e.status === "pendiente").length

  const fixedExpensesCount = expenses.filter((e) => e.category === "fijo").length
  const variableExpensesCount = expenses.filter((e) => e.category === "variable").length
  const creditCardExpensesCount = expenses.filter((e) => e.category === "tarjeta").length

  // Upcoming due dates
  const today = new Date()
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingExpenses = expenses.filter((expense) => {
    if (expense.status === "pagado") return false
    const dueDate = new Date(expense.due_date)
    return dueDate >= today && dueDate <= nextWeek
  })

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-200">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-3xl font-bold text-white">
              {formatCurrency(stats.totalPaid + stats.totalPending)}
            </div>
            <p className="text-xs text-slate-400">{stats.totalExpenses} gastos registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-800 to-emerald-700 border-emerald-600 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-200">Pagados</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-3xl font-bold text-emerald-300">{formatCurrency(stats.totalPaid)}</div>
            <p className="text-xs text-slate-400">{paidExpensesCount} gastos pagados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-800 to-amber-700 border-amber-600 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-200">Pendientes</CardTitle>
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-3xl font-bold text-amber-300">{formatCurrency(stats.totalPending)}</div>
            <p className="text-xs text-slate-400">{pendingExpensesCount} gastos pendientes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-800 to-red-700 border-red-600 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-200">Próximos Vencimientos</CardTitle>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-3xl font-bold text-red-300">{stats.upcomingDue}</div>
            <p className="text-xs text-slate-400">gastos por vencer</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-200">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              Gastos Fijos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-3xl font-bold text-blue-300">{formatCurrency(stats.totalFixed)}</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">{fixedExpensesCount} gastos</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-200">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              Tarjetas de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-3xl font-bold text-amber-300">{formatCurrency(stats.totalCards)}</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">{creditCardExpensesCount} tarjetas</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-200">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              Gastos Variables
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-3xl font-bold text-purple-300">{formatCurrency(stats.totalVariable)}</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">{variableExpensesCount} gastos</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
            <Calendar className="h-5 w-5 text-blue-400" />
            Gastos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses
              .slice(0, 5)
              .map((expense) => (
                <div key={expense.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-200">{expense.description}</span>
                      <div className="text-sm text-slate-400">
                        {new Date(expense.due_date).toLocaleDateString("es-AR")} • {expense.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={expense.status === "pagado" ? "default" : "secondary"}
                        className={expense.status === "pagado" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}
                      >
                        {expense.status === "pagado" ? "Pagado" : "Pendiente"}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-600 border-slate-500 text-slate-200">
                        {formatCurrency(expense.amount)}
                      </Badge>
                    </div>
                  </div>
                  {expense.payment_code && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Código de pago:</span>
                        <code className="text-xs bg-slate-800 px-2 py-1 rounded text-blue-300 font-mono">
                          {expense.payment_code}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(expense.payment_code!)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Copiar código"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            {expenses.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No hay gastos para mostrar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Due Dates */}
      {upcomingExpenses.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-800/20 to-amber-700/20 border-amber-600/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Próximos Vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-amber-800/20 rounded-lg border border-amber-600/30 hover:bg-amber-800/30 transition-colors">
                  <div>
                    <span className="font-medium text-slate-200">{expense.description}</span>
                    <div className="text-sm text-amber-300">
                      Vence: {new Date(expense.due_date).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-amber-300 border-amber-500 bg-amber-800/30">
                    {formatCurrency(expense.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
