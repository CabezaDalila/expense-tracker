"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Home, Users, ArrowLeft, Check, Copy, PartyPopper, KeyRound, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface HouseholdSetupProps {
  onComplete: () => void
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-blob absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="auth-blob absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" style={{ animationDelay: "-6s" }} />
      </div>
      <div className="auth-fade-up relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}

export function HouseholdSetup({ onComplete }: HouseholdSetupProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose")
  const [householdName, setHouseholdName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!householdName.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/household/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCreatedCode(data.inviteCode)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/household/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: "¡Listo!", description: `Te uniste a ${data.household.name}` })
      onComplete()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    if (!createdCode) return
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Código copiado" })
  }

  // ── Pantalla: hogar creado ──
  if (createdCode) {
    return (
      <AuthShell>
        <div className="auth-glass rounded-3xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/50">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">¡Hogar creado!</h2>
          <p className="mt-2 text-sm text-slate-400">
            Compartí este código con tu pareja para que se una al mismo hogar.
          </p>

          <button
            onClick={copyCode}
            className="group mx-auto my-7 flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 px-6 py-5 transition-all hover:border-blue-500/60 hover:bg-blue-500/10"
          >
            <span className="font-mono text-3xl font-bold tracking-[0.3em] text-blue-300">{createdCode}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 transition-colors group-hover:bg-blue-500/30">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </span>
          </button>

          <Button
            onClick={onComplete}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-6 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-600 active:scale-[0.98]"
          >
            Entrar a la app
          </Button>
        </div>
      </AuthShell>
    )
  }

  // ── Pantalla: elegir ──
  if (mode === "choose") {
    return (
      <AuthShell>
        <div className="auth-glass rounded-3xl p-8 shadow-2xl">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Configurá tu hogar</h2>
            <p className="mt-2 text-sm text-slate-400">¿Es la primera vez o tu pareja ya creó uno?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 text-left transition-all hover:border-blue-500/50 hover:bg-slate-800/70"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 transition-colors group-hover:bg-blue-500/25">
                <Home className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-white">Crear un nuevo hogar</span>
                <span className="block text-xs text-slate-400">Generás un código para invitar a tu pareja</span>
              </span>
            </button>

            <button
              onClick={() => setMode("join")}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-800/70"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors group-hover:bg-emerald-500/25">
                <Users className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-white">Unirme a un hogar</span>
                <span className="block text-xs text-slate-400">Usás el código que te pasó tu pareja</span>
              </span>
            </button>
          </div>
        </div>
      </AuthShell>
    )
  }

  // ── Pantalla: crear ──
  if (mode === "create") {
    return (
      <AuthShell>
        <div className="auth-glass rounded-3xl p-8 shadow-2xl">
          <button onClick={() => setMode("choose")} className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
              <Home className="h-5 w-5 text-white" />
            </span>
            <h2 className="text-xl font-bold text-white">Crear hogar</h2>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Nombre del hogar</Label>
            <Input
              autoFocus
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Ej: Casa de Dali y Manu"
              className="h-12 rounded-xl border-slate-700 bg-slate-800/60 text-white placeholder-slate-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading || !householdName.trim()}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-6 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear hogar"}
          </Button>
        </div>
      </AuthShell>
    )
  }

  // ── Pantalla: unirse ──
  return (
    <AuthShell>
      <div className="auth-glass rounded-3xl p-8 shadow-2xl">
        <button onClick={() => setMode("choose")} className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
            <KeyRound className="h-5 w-5 text-white" />
          </span>
          <h2 className="text-xl font-bold text-white">Unirse a un hogar</h2>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Código de invitación</Label>
          <Input
            autoFocus
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="A B 1 2 C D"
            maxLength={6}
            className="h-14 rounded-xl border-slate-700 bg-slate-800/60 text-center font-mono text-2xl tracking-[0.4em] text-white placeholder-slate-600 focus:border-emerald-500"
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <p className="text-xs text-slate-500">Pedile el código a quien creó el hogar</p>
        </div>

        <Button
          onClick={handleJoin}
          disabled={loading || inviteCode.length < 6}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-6 text-base font-semibold text-white shadow-lg transition-all hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Unirme"}
        </Button>
      </div>
    </AuthShell>
  )
}
