import webpush from "web-push"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

let configured = false
function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@example.com"
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys no configuradas (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)")
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export interface StoredSubscription {
  id: number
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendToSubscription(sub: StoredSubscription, payload: PushPayload): Promise<boolean> {
  ensureConfigured()
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    )
    return true
  } catch (err: any) {
    const statusCode = err?.statusCode
    // 404 / 410: la suscripción ya no es válida; la borramos para no reintentar
    if (statusCode === 404 || statusCode === 410) {
      await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`
    } else {
      console.error("[push] Error enviando push:", statusCode, err?.body || err?.message)
    }
    return false
  }
}
