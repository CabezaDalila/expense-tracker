"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff, Settings, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { usePushSubscription } from "@/hooks/use-push-subscription"
import { useToast } from "@/hooks/use-toast"

export function NotificationSettings(_props: { userId: string }) {
  const { isSupported, permission, isSubscribed, loading, enable, disable } = usePushSubscription()
  const { toast } = useToast()

  const handleToggle = async (next: boolean) => {
    if (next) {
      const res = await enable()
      if (res.ok) {
        toast({ title: "Notificaciones activadas", description: "Vas a recibir avisos a las 9 AM y 9 PM." })
      } else {
        toast({ title: "No se pudieron activar", description: res.error, variant: "destructive" })
      }
    } else {
      const res = await disable()
      if (res.ok) toast({ title: "Notificaciones desactivadas" })
    }
  }

  const status = !isSupported
    ? { icon: <XCircle className="h-4 w-4 text-red-500" />, text: "No soportado", color: "text-red-500" }
    : permission === "granted"
      ? { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: "Permitido", color: "text-green-500" }
      : permission === "denied"
        ? { icon: <XCircle className="h-4 w-4 text-red-500" />, text: "Denegado", color: "text-red-500" }
        : { icon: <BellOff className="h-4 w-4 text-yellow-500" />, text: "No solicitado", color: "text-yellow-500" }

  return (
    <Card className="border-slate-600 bg-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-200">
          <Settings className="h-5 w-5 text-blue-400" />
          Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-400" />
            <div>
              <div className="font-medium text-slate-200">Recordatorios de gastos</div>
              <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                {status.icon}
                {status.text}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Aviso a las 9 AM y 9 PM si hay gastos por vencer o vencidos sin pagar.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={!isSupported || permission === "denied" || loading}
            />
          </div>
        </div>

        {!isSupported && (
          <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/20 p-3 text-sm text-yellow-300">
            Este dispositivo/navegador no soporta notificaciones push. En iPhone la app tiene que estar instalada desde Safari.
          </div>
        )}

        {permission === "denied" && (
          <div className="rounded-lg border border-red-600/30 bg-red-900/20 p-3 text-sm text-red-300">
            Las notificaciones están bloqueadas. Habilitalas en la configuración del navegador.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
