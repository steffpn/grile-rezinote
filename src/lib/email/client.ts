import { Resend } from "resend"
import { getAppUrl } from "@/lib/env-url"

const apiKey = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "grile-ReziNOTE <noreply@grile-rezinote.ro>"

let client: Resend | null = null

function getClient(): Resend | null {
  if (!apiKey) return null
  if (!client) client = new Resend(apiKey)
  return client
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getClient()
  if (!resend) {
    console.error(
      "[email] RESEND_API_KEY is not set. Email NOT sent. Subject:",
      subject,
      "to:",
      to
    )
    return { ok: false, error: "email-disabled" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text: text ?? stripHtml(html),
    })

    if (error) {
      console.error("[email] resend error:", error.name, error.message)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    console.error("[email] send threw:", message)
    return { ok: false, error: message }
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function appUrl(): string {
  return getAppUrl() ?? "https://grile-rezinote.ro"
}
