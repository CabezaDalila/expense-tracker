"use client"

import { useEffect, useState } from "react"

// Convierte una clave VAPID base64-url en el Uint8Array que espera pushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = typeof window !== "undefined" ? window.atob(base64) : ""
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setIsSupported(supported)
    if (!supported) return
    setPermission(Notification.permission)
    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(!!sub)
      } catch {}
    })()
  }, [])

  const enable = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupported) return { ok: false, error: "Este dispositivo no soporta notificaciones push" }
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") return { ok: false, error: "Permiso denegado" }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) return { ok: false, error: "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY" }

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        })
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) return { ok: false, error: "No se pudo guardar la suscripción" }
      setIsSubscribed(true)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e?.message || "Error desconocido" }
    } finally {
      setLoading(false)
    }
  }

  const disable = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupported) return { ok: false }
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        })
      }
      setIsSubscribed(false)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e?.message || "Error desconocido" }
    } finally {
      setLoading(false)
    }
  }

  return { isSupported, permission, isSubscribed, loading, enable, disable }
}
