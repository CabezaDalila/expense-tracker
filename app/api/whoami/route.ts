import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Endpoint temporal: muestra tu user_id y household_id para configurar
// INGEST_USER_ID e INGEST_HOUSEHOLD_ID. Borrar una vez configurado.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  return NextResponse.json({
    INGEST_USER_ID: session.user.id,
    INGEST_HOUSEHOLD_ID: session.user.householdId ?? null,
    email: session.user.email,
    nota: "Copiá estos dos valores en las variables de entorno de Vercel. Después borrá este endpoint.",
  })
}
