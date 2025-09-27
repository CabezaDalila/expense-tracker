"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/hooks/use-notifications"

interface NotificationManagerProps {
  userId: string
}

export function NotificationManager({ userId }: NotificationManagerProps) {
  const { showExpenseReminder } = useNotifications()
  const [hasCheckedToday, setHasCheckedToday] = useState(false)

  useEffect(() => {
    // Solo verificar una vez por día
    const today = new Date().toDateString()
    const lastCheck = localStorage.getItem(`notification-check-${userId}-${today}`)
    
    if (!lastCheck) {
      checkAndNotifyExpenses()
      localStorage.setItem(`notification-check-${userId}-${today}`, "true")
      setHasCheckedToday(true)
    }
  }, [userId])

  const checkAndNotifyExpenses = async () => {
    try {
      // Obtener configuración de notificaciones
      const settings = localStorage.getItem(`notification-settings-${userId}`)
      if (!settings) return

      const { browserNotifications, dailyReminders, urgentReminders } = JSON.parse(settings)
      
      if (!browserNotifications) return

      // Verificar gastos que vencen hoy
      if (urgentReminders) {
        const todayResponse = await fetch(`/api/expenses/today?userId=${userId}`)
        if (todayResponse.ok) {
          const todayExpenses = await todayResponse.json()
          todayExpenses.forEach((expense: any) => {
            showExpenseReminder(expense.description, expense.amount, true)
          })
        }
      }

      // Verificar gastos que vencen mañana
      if (dailyReminders) {
        const tomorrowResponse = await fetch(`/api/expenses/tomorrow?userId=${userId}`)
        if (tomorrowResponse.ok) {
          const tomorrowExpenses = await tomorrowResponse.json()
          tomorrowExpenses.forEach((expense: any) => {
            showExpenseReminder(expense.description, expense.amount, false)
          })
        }
      }
    } catch (error) {
      console.error("Error checking expenses for notifications:", error)
    }
  }

  // Este componente no renderiza nada visualmente
  return null
}
