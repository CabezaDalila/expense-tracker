"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Pencil, Copy, Check, FileText, ReceiptText, Download, Loader2, CalendarDays, Tag, CircleDot, User } from "lucide-react"
import type { Expense } from "@/lib/database"

interface ExpenseDetailProps {
  expense: Expense | undefined
  onClose: () => void
  onEdit: (expense: Expense) => void
}

const categoryLabels = { fijo: "Gasto fijo", tarjeta: "Tarjeta de crédito", variable: "Gasto variable" } as const

export function ExpenseDetail({ expense, onClose, onEdit }: ExpenseDetailProps) {
  const [copied, setCopied] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState<"receipt" | "invoice" | null>(null)
  const [doc, setDoc] = useState<{ data: string; name: string; title: string } | null>(null)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount)
  const formatDate = (s: string) => new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })

  const viewDoc = async (kind: "receipt" | "invoice") => {
    if (!expense) return
    setLoadingDoc(kind)
    try {
      const res = await fetch(`/api/expenses/${expense.id}/${kind}`)
      if (!res.ok) throw new Error()
      const { data, name } = await res.json()
      setDoc({ data, name: name || "documento", title: kind === "receipt" ? "Comprobante de pago" : "Factura" })
    } catch {
      /* noop */
    } finally {
      setLoadingDoc(null)
    }
  }

  const docIsPdf = doc?.data?.startsWith("data:application/pdf")
  const isPaid = expense?.status === "pagado"

  return (
    <>
      <Dialog open={!!expense} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="!w-[calc(100vw-2rem)] !max-w-md !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 border-slate-700 bg-slate-900 p-5 sm:p-6">
          {expense && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Detalle del gasto</DialogTitle>
              </DialogHeader>

              {/* Encabezado: monto + estado */}
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4">
                <p className="text-sm text-slate-400">{expense.description}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-3xl font-bold text-white">{formatCurrency(expense.amount)}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isPaid ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {isPaid ? "Pagado" : "Pendiente"}
                  </span>
                </div>
              </div>

              {/* Campos */}
              <div className="space-y-3 text-sm">
                <Row icon={<Tag className="h-4 w-4" />} label="Categoría" value={categoryLabels[expense.category]} />
                <Row icon={<CalendarDays className="h-4 w-4" />} label="Vencimiento" value={formatDate(expense.due_date)} />
                <Row icon={<CircleDot className="h-4 w-4" />} label="Estado" value={isPaid ? "Pagado" : "Pendiente"} />
                {expense.added_by_name && (
                  <Row icon={<User className="h-4 w-4" />} label="Agregado por" value={expense.added_by_name} />
                )}
                {expense.notes && (
                  <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
                    <p className="text-xs text-slate-500">Notas</p>
                    <p className="mt-0.5 text-slate-200">{expense.notes}</p>
                  </div>
                )}
                {expense.payment_code && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
                    <span className="text-xs text-slate-500">Código:</span>
                    <code className="flex-1 truncate font-mono text-xs text-blue-300">{expense.payment_code}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(expense.payment_code!); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Documentos */}
              {(expense.has_receipt || expense.has_invoice) && (
                <div className="flex flex-wrap gap-2">
                  {expense.has_receipt && (
                    <button
                      onClick={() => viewDoc("receipt")}
                      disabled={loadingDoc !== null}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
                    >
                      {loadingDoc === "receipt" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      {loadingDoc === "receipt" ? "Abriendo..." : "Comprobante"}
                    </button>
                  )}
                  {expense.has_invoice && (
                    <button
                      onClick={() => viewDoc("invoice")}
                      disabled={loadingDoc !== null}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/10 disabled:opacity-50"
                    >
                      {loadingDoc === "invoice" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ReceiptText className="h-3.5 w-3.5" />}
                      {loadingDoc === "invoice" ? "Abriendo..." : "Factura"}
                    </button>
                  )}
                </div>
              )}

              {/* Editar */}
              <Button
                onClick={() => onEdit(expense)}
                className="w-full gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-5 font-semibold text-white hover:from-blue-500 hover:to-blue-600"
              >
                <Pencil className="h-4 w-4" /> Editar gasto
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Visor de documento */}
      <Dialog open={!!doc} onOpenChange={(open) => !open && setDoc(null)}>
        <DialogContent className="!w-[calc(100vw-2rem)] !max-w-2xl !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 border-slate-700 bg-slate-900 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-blue-400" />
              {doc?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-xl bg-slate-950/60 p-2">
            {doc && (docIsPdf ? (
              <iframe src={doc.data} className="h-[70vh] w-full rounded-lg border-0" title={doc.title} />
            ) : (
              <img src={doc.data} alt={doc.title} className="mx-auto h-auto max-w-full rounded-lg" />
            ))}
          </div>
          {doc && (
            <a
              href={doc.data}
              download={doc.name}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
            >
              <Download className="h-4 w-4" /> Descargar
            </a>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-400">{icon} {label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  )
}
