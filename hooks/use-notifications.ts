"use client"

import { useState, useEffect } from "react"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if ("Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Este navegador no soporta notificaciones")
      return false
    }

    if (permission === "granted") {
      return true
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === "granted"
    } catch (error) {
      console.error("Error al solicitar permisos de notificación:", error)
      return false
    }
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== "granted") {
      console.warn("No se pueden mostrar notificaciones")
      return null
    }

    try {
      return new Notification(title, {
        icon: "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        ...options
      })
    } catch (error) {
      console.error("Error al mostrar notificación:", error)
      return null
    }
  }

  const showExpenseReminder = (expenseDescription: string, amount: number, isToday: boolean = false) => {
    const title = isToday ? "¡Gasto vence HOY!" : "Recordatorio: Gasto vence mañana"
    const body = `${expenseDescription} - ${new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS"
    }).format(amount)}`

    return showNotification(title, {
      body,
      tag: `expense-${expenseDescription}`,
      requireInteraction: isToday, // Las notificaciones de hoy requieren interacción
    })
  }

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showExpenseReminder
  }
}


