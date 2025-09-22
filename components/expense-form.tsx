"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { Expense, ExpenseInput } from "@/lib/database"

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (expense: ExpenseInput) => void
  onCancel: () => void
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    description: expense?.description || "",
    amount: expense?.amount?.toString() || "",
    category: expense?.category || ("fijo" as const),
    status: expense?.status || ("pendiente" as const),
    due_date: expense?.due_date ? expense.due_date.split("T")[0] : "",
    notes: expense?.notes || "",
    propagation_months: "12" as string,
    payment_code: expense?.payment_code || ""
  })
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount || !formData.due_date) return

    onSubmit({
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      category: formData.category,
      status: formData.status,
      due_date: formData.due_date,
      notes: formData.notes || undefined,
      payment_code: formData.payment_code || undefined,
      propagation_months: formData.category === "fijo" 
        ? (formData.propagation_months === "indefinido" ? "indefinido" : 
           formData.propagation_months ? Number.parseInt(formData.propagation_months) : 12)
        : undefined,
    })
  }

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="heading-secondary text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">$</span>
          </div>
          {expense ? "Editar Gasto" : "Nuevo Gasto"}
        </CardTitle>
        <p className="text-slate-400 text-fluid-sm">
          {expense ? "Modifica los detalles del gasto" : "Agrega un nuevo gasto a tu control"}
        </p>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="description" className="text-slate-200 font-medium">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ej: ICBC, Luz, Parquero..."
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="amount" className="text-slate-200 font-medium">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pl-8"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="category" className="text-slate-200 font-medium">Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="fijo" className="text-white hover:bg-slate-700">Gastos Fijos</SelectItem>
                <SelectItem value="variable" className="text-white hover:bg-slate-700">Gastos Variables</SelectItem>
                <SelectItem value="tarjeta" className="text-white hover:bg-slate-700">Tarjetas de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.category === "fijo" && (
            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <Label className="text-slate-200 font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Propagación
              </Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="propagation-limited"
                    name="propagation-type"
                    checked={formData.propagation_months !== "indefinido"}
                    onChange={() => setFormData((prev) => ({ ...prev, propagation_months: "12" }))}
                    className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="propagation-limited" className="text-slate-300 font-normal cursor-pointer">
                    Por un número específico de meses
                  </Label>
                </div>
                
                {formData.propagation_months !== "indefinido" && (
                  <div className="ml-7 flex items-center gap-3">
                    <Input
                      id="propagation-months"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.propagation_months}
                      onChange={(e) => setFormData((prev) => ({ ...prev, propagation_months: e.target.value }))}
                      placeholder="12"
                      className="w-20 bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-slate-400 text-sm">meses</span>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="propagation-indefinite"
                    name="propagation-type"
                    checked={formData.propagation_months === "indefinido"}
                    onChange={() => setFormData((prev) => ({ ...prev, propagation_months: "indefinido" }))}
                    className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="propagation-indefinite" className="text-slate-300 font-normal cursor-pointer">
                    Indefinidamente (se crean 12 meses por defecto)
                  </Label>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Cuántos meses se repetirá este gasto fijo
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="status" className="text-slate-200 font-medium">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="pendiente" className="text-white hover:bg-slate-700">Pendiente</SelectItem>
                <SelectItem value="pagado" className="text-white hover:bg-slate-700">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="dueDate" className="text-slate-200 font-medium">Fecha de Vencimiento</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-slate-200 font-medium">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales..."
              rows={2}
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="payment_code" className="text-slate-200 font-medium">Código de Pago (opcional)</Label>
            <Input
              id="payment_code"
              value={formData.payment_code}
              onChange={(e) => setFormData((prev) => ({ ...prev, payment_code: e.target.value }))}
              placeholder="Ej: CBU, Alias, QR, etc."
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
            />
            <p className="text-xs text-slate-400">
              Código para realizar el pago (CBU, Alias, código QR, etc.)
            </p>
          </div>

          <div className="flex gap-3 pt-6">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl button-text"
            >
              {expense ? "Actualizar" : "Crear"} Gasto
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white py-2.5 rounded-lg transition-all duration-200 button-text"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
