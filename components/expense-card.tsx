"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, DollarSign, CheckCircle, Clock, Copy, Check } from "lucide-react"
import { useState } from "react"
import type { Expense } from "@/lib/database"

interface ExpenseCardProps {
  expense: Expense
  onStatusChange: (id: number, status: Expense["status"]) => void
  onEdit: (expense: Expense) => void
}

export function ExpenseCard({ expense, onStatusChange, onEdit }: ExpenseCardProps) {
  const [copied, setCopied] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const handleCopyCode = async () => {
    if (expense.payment_code) {
      try {
        await navigator.clipboard.writeText(expense.payment_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Error copying to clipboard:', err)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  const getStatusIcon = () => {
    switch (expense.status) {
      case "pagado":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "pendiente":
        return <Clock className="h-4 w-4 text-warning" />
      default:
        return <Clock className="h-4 w-4 text-warning" />
    }
  }

  const getStatusColor = () => {
    switch (expense.status) {
      case "pagado":
        return "bg-success/10 text-success border-success/20"
      case "pendiente":
        return "bg-warning/10 text-warning border-warning/20"
      default:
        return "bg-warning/10 text-warning border-warning/20"
    }
  }

  const getCategoryIcon = () => {
    switch (expense.category) {
      case "tarjeta":
        return <CreditCard className="h-4 w-4" />
      case "fijo":
        return <DollarSign className="h-4 w-4" />
      case "variable":
        return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusLabel = () => {
    switch (expense.status) {
      case "pagado":
        return "Pagado"
      case "pendiente":
        return "Pendiente"
      default:
        return "Pendiente"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon()}
            <h3 className="font-semibold text-card-foreground card-title">{expense.description}</h3>
          </div>
          <Badge className={getStatusColor()}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusLabel()}
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-fluid-2xl font-bold text-primary">{formatCurrency(expense.amount)}</span>
            <span className="text-fluid-sm text-muted-foreground">Vence: {formatDate(expense.due_date)}</span>
          </div>

          {expense.notes && <p className="text-fluid-sm text-muted-foreground italic">{expense.notes}</p>}

          {expense.payment_code && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-fluid-xs text-muted-foreground font-medium">Código de pago:</span>
                <code className="text-fluid-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-mono">
                  {expense.payment_code}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Copiar código"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {expense.status !== "pagado" && (
              <Button size="sm" onClick={() => onStatusChange(expense.id, "pagado")} className="flex-1">
                Marcar como Pagado
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onEdit(expense)} className="flex-1">
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
