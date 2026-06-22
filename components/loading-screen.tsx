"use client"

import { useEffect, useState } from "react"

const messages = [
  "Contando las monedas...",
  "Revisando los vencimientos...",
  "Ordenando los gastos...",
  "Sacando la calculadora...",
  "Buscando ese gasto que olvidaste...",
  "Sumando los pesos...",
]

export function LoadingScreen() {
  const [msg, setMsg] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setMsg((m) => (m + 1) % messages.length), 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="flex flex-col items-center gap-6">
        {/* Anillo giratorio con $ en el centro */}
        <div className="loading-float relative h-20 w-20">
          <div className="loading-ring absolute inset-0 rounded-full" />
          <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-slate-900">
            <span className="text-3xl font-bold text-blue-400">$</span>
          </div>
        </div>

        <span className="text-sm text-slate-400">{messages[msg]}</span>
      </div>
    </div>
  )
}
