"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Settings, CheckCircle, XCircle } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"

interface NotificationSettingsProps {
  userId: string
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const { isSupported, permission, requestPermission, showNotification } = useNotifications()
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false)
  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(true)
  const [urgentRemindersEnabled, setUrgentRemindersEnabled] = useState(true)

  useEffect(() => {
    // Cargar configuración guardada
    const savedSettings = localStorage.getItem(`notification-settings-${userId}`)
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setBrowserNotificationsEnabled(settings.browserNotifications || false)
      setDailyRemindersEnabled(settings.dailyReminders !== false)
      setUrgentRemindersEnabled(settings.urgentReminders !== false)
    }
  }, [userId])

  const handleBrowserNotificationToggle = async () => {
    if (!browserNotificationsEnabled) {
      // Solicitar permisos
      const granted = await requestPermission()
      if (granted) {
        setBrowserNotificationsEnabled(true)
        // Mostrar notificación de prueba
        showNotification("¡Notificaciones activadas!", {
          body: "Ahora recibirás recordatorios de gastos próximos a vencer.",
          tag: "notification-enabled"
        })
      }
    } else {
      setBrowserNotificationsEnabled(false)
    }
    saveSettings()
  }

  const saveSettings = () => {
    const settings = {
      browserNotifications: browserNotificationsEnabled,
      dailyReminders: dailyRemindersEnabled,
      urgentReminders: urgentRemindersEnabled
    }
    localStorage.setItem(`notification-settings-${userId}`, JSON.stringify(settings))
  }

  const handleDailyRemindersToggle = (enabled: boolean) => {
    setDailyRemindersEnabled(enabled)
    saveSettings()
  }

  const handleUrgentRemindersToggle = (enabled: boolean) => {
    setUrgentRemindersEnabled(enabled)
    saveSettings()
  }

  const getPermissionStatus = () => {
    if (!isSupported) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: "No soportado",
        color: "text-red-500"
      }
    }

    switch (permission) {
      case "granted":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: "Permitido",
          color: "text-green-500"
        }
      case "denied":
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          text: "Denegado",
          color: "text-red-500"
        }
      default:
        return {
          icon: <BellOff className="h-4 w-4 text-yellow-500" />,
          text: "No solicitado",
          color: "text-yellow-500"
        }
    }
  }

  const permissionStatus = getPermissionStatus()

  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-200">
          <Settings className="h-5 w-5 text-blue-400" />
          Configuración de Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de permisos del navegador */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-400" />
            <div>
              <div className="font-medium text-slate-200">Notificaciones del navegador</div>
              <div className={`text-sm flex items-center gap-1 ${permissionStatus.color}`}>
                {permissionStatus.icon}
                {permissionStatus.text}
              </div>
            </div>
          </div>
          <Switch
            checked={browserNotificationsEnabled}
            onCheckedChange={handleBrowserNotificationToggle}
            disabled={!isSupported || permission === "denied"}
          />
        </div>

        {/* Recordatorios diarios */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-green-400" />
            <div>
              <div className="font-medium text-slate-200">Recordatorios diarios</div>
              <div className="text-sm text-slate-400">
                Notificaciones para gastos que vencen mañana
              </div>
            </div>
          </div>
          <Switch
            checked={dailyRemindersEnabled}
            onCheckedChange={handleDailyRemindersToggle}
          />
        </div>

        {/* Recordatorios urgentes */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-red-400" />
            <div>
              <div className="font-medium text-slate-200">Recordatorios urgentes</div>
              <div className="text-sm text-slate-400">
                Notificaciones para gastos que vencen hoy
              </div>
            </div>
          </div>
          <Switch
            checked={urgentRemindersEnabled}
            onCheckedChange={handleUrgentRemindersToggle}
          />
        </div>

        {!isSupported && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-300">
              <BellOff className="h-4 w-4" />
              <span className="text-sm">
                Tu navegador no soporta notificaciones. Considera usar Chrome, Firefox o Safari.
              </span>
            </div>
          </div>
        )}

        {permission === "denied" && (
          <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">
                Las notificaciones están bloqueadas. Habilítalas en la configuración de tu navegador.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
