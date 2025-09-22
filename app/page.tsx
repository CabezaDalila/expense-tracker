"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Home, CreditCard, TrendingDown, Calendar } from "lucide-react"
import { ExpenseDashboard } from "@/components/expense-dashboard"
import { ExpenseCard } from "@/components/expense-card"
import { ExpenseForm } from "@/components/expense-form"
import { DateFilter } from "@/components/date-filter"
import type { Expense, ExpenseInput } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalPaid: 0,
    totalPending: 0,
    totalFixed: 0,
    totalVariable: 0,
    totalCards: 0,
    upcomingDue: 0,
  })
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadExpenses = async (year?: string, month?: string) => {
    try {
      const params = new URLSearchParams()
      if (year) params.append('year', year)
      if (month && month !== 'all') params.append('month', month)
      
      const queryString = params.toString()
      const baseUrl = "/api/expenses"
      const statsUrl = "/api/expenses/stats"
      
      const [expensesResponse, statsResponse] = await Promise.all([
        fetch(queryString ? `${baseUrl}?${queryString}` : baseUrl),
        fetch(queryString ? `${statsUrl}?${queryString}` : statsUrl),
      ])

      if (expensesResponse.ok && statsResponse.ok) {
        const expensesData = await expensesResponse.json()
        const statsData = await statsResponse.json()
        setExpenses(expensesData)
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error loading expenses:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  // Reload data when date filters change
  useEffect(() => {
    if (selectedYear || selectedMonth) {
      loadExpenses(selectedYear, selectedMonth)
    }
  }, [selectedYear, selectedMonth])

  // Filter expenses based on search and filters
  useEffect(() => {
    let filtered = expenses

    if (searchTerm) {
      filtered = filtered.filter((expense) => expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((expense) => expense.category === filterCategory)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((expense) => expense.status === filterStatus)
    }

    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, filterCategory, filterStatus])

  const handleAddExpense = async (expenseData: ExpenseInput) => {
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      })

      if (response.ok) {
        await loadExpenses(selectedYear, selectedMonth) // Reload data with current filters
        setIsFormOpen(false)
        toast({
          title: "Gasto agregado",
          description: `${expenseData.description} ha sido agregado exitosamente.`,
        })
      } else {
        throw new Error("Failed to create expense")
      }
    } catch (error) {
      console.error("Error creating expense:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto.",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = async (expenseData: ExpenseInput) => {
    if (!editingExpense) return

    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      })

      if (response.ok) {
        await loadExpenses(selectedYear, selectedMonth) // Reload data with current filters
        setEditingExpense(undefined)
        setIsFormOpen(false)
        toast({
          title: "Gasto actualizado",
          description: `${expenseData.description} ha sido actualizado exitosamente.`,
        })
      } else {
        throw new Error("Failed to update expense")
      }
    } catch (error) {
      console.error("Error updating expense:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el gasto.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (id: number, status: Expense["status"]) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await loadExpenses(selectedYear, selectedMonth) // Reload data with current filters
        toast({
          title: "Estado actualizado",
          description: `El gasto ha sido marcado como ${status === "pagado" ? "pagado" : "pendiente"}.`,
        })
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingExpense(undefined)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando gastos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="heading-primary text-white mb-2">Control de Gastos</h1>
            <p className="text-slate-400 subtitle">Gestiona tus gastos fijos, variables y tarjetas de crédito</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl button-text">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Nuevo Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="!w-[calc(100vw-2rem)] !max-w-lg !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 bg-slate-900 border-slate-700 p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-white card-title">{editingExpense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
                </DialogHeader>
                <ExpenseForm
                  expense={editingExpense}
                  onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
                  onCancel={handleCloseForm}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 text-fluid-xs py-2 sm:py-3">
              <Home className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger value="fijo" className="gap-1 sm:gap-2 text-fluid-xs py-2 sm:py-3">
              <Home className="h-3 w-3 sm:h-4 sm:w-4" />
              Fijos
            </TabsTrigger>
            <TabsTrigger value="tarjeta" className="gap-1 sm:gap-2 text-fluid-xs py-2 sm:py-3">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tarjetas</span>
              <span className="sm:hidden">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="variable" className="gap-1 sm:gap-2 text-fluid-xs py-2 sm:py-3">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Variables</span>
              <span className="sm:hidden">Var</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-center">
                <div className="flex gap-2 w-full max-w-md">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="flex-1 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 h-8 text-xs">
                      <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-white hover:bg-slate-700 text-xs">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="flex-1 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 h-8 text-xs">
                      <Filter className="h-3 w-3 mr-1 text-slate-400" />
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {[
                        { value: "all", label: "Todos" },
                        { value: "01", label: "Ene" },
                        { value: "02", label: "Feb" },
                        { value: "03", label: "Mar" },
                        { value: "04", label: "Abr" },
                        { value: "05", label: "May" },
                        { value: "06", label: "Jun" },
                        { value: "07", label: "Jul" },
                        { value: "08", label: "Ago" },
                        { value: "09", label: "Sep" },
                        { value: "10", label: "Oct" },
                        { value: "11", label: "Nov" },
                        { value: "12", label: "Dic" },
                      ].map((month) => (
                        <SelectItem key={month.value} value={month.value} className="text-white hover:bg-slate-700 text-xs">
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ExpenseDashboard 
                expenses={expenses} 
                stats={stats}
              />
            </div>
          </TabsContent>

          <TabsContent value="fijo" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar gastos fijos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pagado">Pagados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              <DateFilter
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredExpenses
                .filter((expense) => expense.category === "fijo")
                .map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEditClick}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="tarjeta" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar tarjetas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pagado">Pagados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              <DateFilter
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredExpenses
                .filter((expense) => expense.category === "tarjeta")
                .map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEditClick}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="variable" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar gastos variables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pagado">Pagados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              <DateFilter
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredExpenses
                .filter((expense) => expense.category === "variable")
                .map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEditClick}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
