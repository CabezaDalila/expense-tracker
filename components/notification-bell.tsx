"use client"

import { useEffect, useState, useRef } from "react"
import { Bell } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NotificationItem {
  id: number
  title: string
  body: string
  url: string | null
  created_at: string
  read_at: string | null
}

function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMin = Math.round((now - then) / 60000)
  if (diffMin < 1) return "recién"
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  const diffD = Math.round(diffH / 24)
  if (diffD < 7) return `hace ${diffD} d`
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const load = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items || [])
      setUnread(data.unread || 0)
    } catch {}
  }

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 60_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleOpenChange = async (next: boolean) => {
    setOpen(next)
    if (next && unread > 0) {
      // Marcar como leídas apenas se abre el panel
      try {
        await fetch("/api/notifications/read", { method: "POST" })
      } catch {}
      setUnread(0)
      setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: new Date().toISOString() })))
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-slate-600 bg-slate-800 p-0 text-slate-200">
        <div className="border-b border-slate-700 px-4 py-3">
          <p className="text-sm font-semibold text-white">Notificaciones</p>
          <p className="text-xs text-slate-400">
            {items.length === 0 ? "No hay avisos todavía" : `Últimas ${items.length}`}
          </p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Sin notificaciones por ahora.
            </div>
          )}
          {items.map((n) => (
            <div key={n.id} className="border-b border-slate-700/50 px-4 py-3 last:border-b-0">
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 text-sm font-medium text-white">{n.title}</p>
                {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{n.body}</p>
              <p className="mt-1 text-[10px] text-slate-500">{formatRelative(n.created_at)}</p>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
