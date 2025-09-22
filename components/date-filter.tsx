"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter } from "lucide-react"

interface DateFilterProps {
  selectedYear: string
  selectedMonth: string
  onYearChange: (year: string) => void
  onMonthChange: (month: string) => void
  className?: string
}

export function DateFilter({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange, 
  className = "" 
}: DateFilterProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  
  const months = [
    { value: "all", label: "Todos los meses" },
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
  ]

  return (
    <div className={`flex gap-2 w-full ${className}`}>
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="flex-1 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 h-9 text-sm">
          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-600">
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()} className="text-white hover:bg-slate-700 text-sm">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="flex-1 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 h-9 text-sm">
          <Filter className="h-4 w-4 mr-2 text-slate-400" />
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-600">
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value} className="text-white hover:bg-slate-700 text-sm">
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
