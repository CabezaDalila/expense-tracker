"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Home, CreditCard, TrendingDown, Calendar, Settings, LogOut, Users, Copy } from "lucide-react"
import { ExpenseDashboard } from "@/components/expense-dashboard"
import { ExpenseCard } from "@/components/expense-card"
import { ExpenseForm } from "@/components/expense-form"
import { NotificationSettings } from "@/components/notification-settings"
import { NotificationManager } from "@/components/notification-manager"
import { InstallPWA } from "@/components/install-pwa"
import { HouseholdSetup } from "@/components/household-setup"
import { LoadingScreen } from "@/components/loading-screen"
import { ExpenseDetail } from "@/components/expense-detail"
import type { Expense, ExpenseInput } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

export default function ExpenseTracker() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  const [expenses, setExpenses] = useState<Expense[]>([])
  // Estadísticas calculadas en el navegador a partir de los gastos (sin viaje extra a la base)
  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const s = {
      totalExpenses: expenses.length,
      totalPaid: 0,
      totalPending: 0,
      totalFixed: 0,
      totalVariable: 0,
      totalCards: 0,
      upcomingDue: 0,
    }
    for (const e of expenses) {
      const amt = Number(e.amount) || 0
      if (e.status === "pagado") s.totalPaid += amt
      else s.totalPending += amt
      if (e.category === "fijo") s.totalFixed += amt
      else if (e.category === "variable") s.totalVariable += amt
      else if (e.category === "tarjeta") s.totalCards += amt
      if (e.status === "pendiente") {
        const due = new Date(e.due_date)
        if (due >= today && due <= weekAhead) s.upcomingDue++
      }
    }
    return s
  }, [expenses])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, "0"))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [viewingExpense, setViewingExpense] = useState<Expense | undefined>()
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [householdInfo, setHouseholdInfo] = useState<any>(null)
  const { toast } = useToast()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const loadExpenses = async (year?: string, month?: string) => {
    try {
      const params = new URLSearchParams()
      if (year) params.append("year", year)
      if (month && month !== "all") params.append("month", month)

      const queryString = params.toString()
      const baseUrl = "/api/expenses"
      const expensesResponse = await fetch(queryString ? `${baseUrl}?${queryString}` : baseUrl)
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json()
        setExpenses(expensesData)
      }
    } catch (error) {
      console.error("Error loading expenses:", error)
      toast({ title: "Error", description: "No se pudieron cargar los gastos.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadHousehold = async () => {
    try {
      const res = await fetch("/api/household")
      if (res.ok) {
        const data = await res.json()
        setHouseholdInfo(data)
      }
    } catch {}
  }

  // Datos del hogar: una sola vez al tener hogar
  useEffect(() => {
    if (session?.user?.householdId) {
      loadHousehold()
    }
  }, [session?.user?.householdId])

  // Gastos: un solo pedido, ya filtrado por período (mes/año)
  useEffect(() => {
    if (session?.user?.householdId) {
      loadExpenses(selectedYear, selectedMonth)
    } else if (session) {
      setLoading(false)
    }
  }, [session?.user?.householdId, selectedYear, selectedMonth])

  useEffect(() => {
    let filtered = expenses
    if (searchTerm) {
      filtered = filtered.filter((e) => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((e) => e.category === filterCategory)
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((e) => e.status === filterStatus)
    }
    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, filterCategory, filterStatus])

  const handleAddExpense = async (expenseData: ExpenseInput) => {
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      })
      if (response.ok) {
        await loadExpenses(selectedYear, selectedMonth)
        setIsFormOpen(false)
        toast({ title: "Gasto agregado", description: `${expenseData.description} agregado exitosamente.` })
      } else {
        throw new Error("Failed to create expense")
      }
    } catch {
      toast({ title: "Error", description: "No se pudo agregar el gasto.", variant: "destructive" })
    }
  }

  const handleEditExpense = async (expenseData: ExpenseInput) => {
    if (!editingExpense) return
    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      })
      if (response.ok) {
        await loadExpenses(selectedYear, selectedMonth)
        setEditingExpense(undefined)
        setIsFormOpen(false)
        toast({ title: "Gasto actualizado", description: `${expenseData.description} actualizado exitosamente.` })
      } else {
        throw new Error("Failed to update expense")
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el gasto.", variant: "destructive" })
    }
  }

  const handleStatusChange = async (id: number, status: Expense["status"]) => {
    // Actualización optimista: cambiamos la UI al instante
    const previous = expenses
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    setViewingExpense((v) => (v && v.id === id ? { ...v, status } : v))
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error()
      toast({ title: "Estado actualizado", description: `Marcado como ${status === "pagado" ? "pagado" : "pendiente"}.` })
    } catch {
      // Si falla, revertimos
      setExpenses(previous)
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" })
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

  const handleDeleteClick = (id: number) => {
    const expense = expenses.find((e) => e.id === id)
    if (expense) {
      setExpenseToDelete(expense)
      setDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return
    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, { method: "DELETE" })
      if (response.ok) {
        await loadExpenses(selectedYear, selectedMonth)
        setDeleteDialogOpen(false)
        setExpenseToDelete(null)
        toast({ title: "Gasto eliminado", description: `${expenseToDelete.description} eliminado.` })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el gasto.", variant: "destructive" })
    }
  }

  // Loading auth
  if (status === "loading" || (status === "authenticated" && loading)) {
    return <LoadingScreen />
  }

  if (status === "unauthenticated") return null

  // Household setup
  if (!session?.user?.householdId) {
    return (
      <HouseholdSetup
        onComplete={() => {
          updateSession()
          setTimeout(() => window.location.reload(), 500)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Control de Gastos</h1>
              {householdInfo && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {householdInfo.name}
                  </span>
                  {householdInfo.members?.length > 0 && (
                    <span className="text-slate-500">· {householdInfo.members.length} miembro{householdInfo.members.length !== 1 ? "s" : ""}</span>
                  )}
                  <button
                    onClick={() => { navigator.clipboard.writeText(householdInfo.invite_code); toast({ title: "Código copiado", description: householdInfo.invite_code }) }}
                    className="flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-400 transition-colors hover:bg-blue-500/20"
                    title="Copiar código de invitación"
                  >
                    <Copy className="h-3 w-3" />
                    {householdInfo.invite_code}
                  </button>
                </div>
              )}
            </div>

            {/* Acciones arriba a la derecha */}
            <div className="flex shrink-0 items-center gap-3">
              {/* Botón nuevo gasto — solo en web */}
              <Button
                onClick={() => setIsFormOpen(true)}
                className="hidden gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-5 font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] sm:inline-flex sm:px-6"
              >
                <Plus className="h-5 w-5" />
                Nuevo Gasto
              </Button>

              {/* User menu */}
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Avatar className="h-10 w-10 ring-2 ring-slate-700">
                    <AvatarImage src={session.user?.image ?? ""} alt={session.user?.name ?? ""} />
                    <AvatarFallback className="bg-slate-600 text-white text-sm">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-slate-600 bg-slate-800 text-slate-200">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-white">{session.user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-slate-600" />
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
                  <Settings className="mr-2 h-4 w-4" />
                  Notificaciones
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-600" />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="cursor-pointer text-red-400 hover:bg-slate-700 hover:text-red-300 focus:bg-slate-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Botón nuevo gasto — solo en celular (full width abajo) */}
          <Button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 w-full gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-5 font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] sm:hidden"
          >
            <Plus className="h-5 w-5" />
            Nuevo Gasto
          </Button>

          {/* Modal de solo lectura */}
          <ExpenseDetail
            expense={viewingExpense}
            onClose={() => setViewingExpense(undefined)}
            onEdit={(exp) => { setViewingExpense(undefined); handleEditClick(exp) }}
          />

          {/* Modal del formulario (controlado) */}
          <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingExpense(undefined) }}>
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

        {/* Manager de notificaciones */}
        <NotificationManager userId={session.user?.id ?? ""} />

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
              {/* Filtro de período */}
              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Período</span>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-9 w-[120px] rounded-xl border-slate-700 bg-slate-800/60 text-sm font-medium text-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-800">
                    {[
                      { value: "all", label: "Todo el año" },
                      { value: "01", label: "Enero" },
                      { value: "02", label: "Febrero" },
                      { value: "03", label: "Marzo" },
                      { value: "04", label: "Abril" },
                      { value: "05", label: "Mayo" },
                      { value: "06", label: "Junio" },
                      { value: "07", label: "Julio" },
                      { value: "08", label: "Agosto" },
                      { value: "09", label: "Septiembre" },
                      { value: "10", label: "Octubre" },
                      { value: "11", label: "Noviembre" },
                      { value: "12", label: "Diciembre" },
                    ].map((month) => (
                      <SelectItem key={month.value} value={month.value} className="text-white hover:bg-slate-700">
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9 w-[88px] rounded-xl border-slate-700 bg-slate-800/60 text-sm font-medium text-white focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-800">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()} className="text-white hover:bg-slate-700">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ExpenseDashboard expenses={expenses} stats={stats} onExpenseClick={setViewingExpense} />
            </div>
          </TabsContent>

          {(["fijo", "tarjeta", "variable"] as const).map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 sm:space-y-6">
              <div className="space-y-2.5 rounded-2xl border border-slate-700/40 bg-slate-800/30 p-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    placeholder={`Buscar ${category === "fijo" ? "gastos fijos" : category === "tarjeta" ? "tarjetas" : "gastos variables"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 rounded-xl border-slate-700 bg-slate-900/50 pl-10 text-sm text-white placeholder-slate-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-10 min-w-0 rounded-xl border-slate-700 bg-slate-900/50 px-3 text-sm text-white focus:border-blue-500">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-800">
                      <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                      <SelectItem value="pagado" className="text-white hover:bg-slate-700">Pagados</SelectItem>
                      <SelectItem value="pendiente" className="text-white hover:bg-slate-700">Pendientes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-10 min-w-0 rounded-xl border-slate-700 bg-slate-900/50 px-3 text-sm text-white focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-800">
                      {[
                        { value: "all", label: "Todo el año" },
                        { value: "01", label: "Enero" },
                        { value: "02", label: "Febrero" },
                        { value: "03", label: "Marzo" },
                        { value: "04", label: "Abril" },
                        { value: "05", label: "Mayo" },
                        { value: "06", label: "Junio" },
                        { value: "07", label: "Julio" },
                        { value: "08", label: "Agosto" },
                        { value: "09", label: "Septiembre" },
                        { value: "10", label: "Octubre" },
                        { value: "11", label: "Noviembre" },
                        { value: "12", label: "Diciembre" },
                      ].map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-white hover:bg-slate-700">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-10 min-w-0 rounded-xl border-slate-700 bg-slate-900/50 px-3 text-sm text-white focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-800">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-white hover:bg-slate-700">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredExpenses
                  .filter((e) => e.category === category)
                  .map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onStatusChange={handleStatusChange}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      onView={setViewingExpense}
                    />
                  ))}
                {filteredExpenses.filter((e) => e.category === category).length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 py-14 text-center">
                    {category === "fijo" ? (
                      <Home className="mb-3 h-10 w-10 text-slate-600" />
                    ) : category === "tarjeta" ? (
                      <CreditCard className="mb-3 h-10 w-10 text-slate-600" />
                    ) : (
                      <TrendingDown className="mb-3 h-10 w-10 text-slate-600" />
                    )}
                    <p className="text-slate-300">No hay gastos en esta categoría</p>
                    <p className="mt-1 text-sm text-slate-500">Agregalos con el botón "Nuevo Gasto"</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Notification settings dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="!w-[calc(100vw-2rem)] !max-w-2xl !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 bg-slate-900 border-slate-700 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-white card-title flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Configuración de Notificaciones
              </DialogTitle>
            </DialogHeader>
            <NotificationSettings userId={session.user?.id ?? ""} />
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">¿Eliminar gasto?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                ¿Estás segura de que querés eliminar "{expenseToDelete?.description}"? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setExpenseToDelete(null) }} className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <InstallPWA />
      </div>
    </div>
  )
}
