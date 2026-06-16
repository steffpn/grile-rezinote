import { appUrl } from "./client"

const BRAND_GREEN = "#10b981"
const BG = "#0a0a0a"
const PANEL = "#111111"
const TEXT = "#e5e5e5"
const MUTED = "#9ca3af"

function shell(opts: {
  preheader: string
  heading: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}): string {
  const { preheader, heading, body, ctaLabel, ctaUrl, footerNote } = opts
  const cta =
    ctaLabel && ctaUrl
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0">
          <tr>
            <td>
              <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:${BRAND_GREEN};color:#0a0a0a;font-weight:600;text-decoration:none;font-size:15px">${ctaLabel}</a>
            </td>
          </tr>
        </table>`
      : ""

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>grile-ReziNOTE</title>
</head>
<body style="margin:0;padding:0;background:${BG};color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased">
  <span style="display:none;color:${BG};max-height:0;overflow:hidden">${preheader}</span>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BG}">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:${PANEL};border:1px solid #1f2937;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:28px 32px 12px 32px;border-bottom:1px solid #1f2937">
              <div style="font-size:18px;font-weight:700;color:#fff">grile-ReziNOTE</div>
              <div style="font-size:13px;color:${MUTED}">Pregatire pentru rezidentiat stomatologie</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:600;color:#fff;line-height:1.3">${heading}</h1>
              <div style="font-size:15px;line-height:1.6;color:${TEXT}">${body}</div>
              ${cta}
              ${
                footerNote
                  ? `<p style="margin:20px 0 0 0;font-size:13px;color:${MUTED};line-height:1.5">${footerNote}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0 0;font-size:12px;color:${MUTED};text-align:center">
          grile-ReziNOTE &middot; <a href="${appUrl()}" style="color:${MUTED};text-decoration:underline">${appUrl().replace(/^https?:\/\//, "")}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function passwordResetEmail(opts: {
  resetUrl: string
  fullName?: string | null
}): { subject: string; html: string } {
  const greeting = opts.fullName ? `Salut, ${escape(opts.fullName)}!` : "Salut!"
  return {
    subject: "Resetare parola — grile-ReziNOTE",
    html: shell({
      preheader: "Foloseste linkul de mai jos pentru a-ti seta o parola noua.",
      heading: "Reseteaza-ti parola",
      body: `
        <p style="margin:0 0 12px 0">${greeting}</p>
        <p style="margin:0 0 12px 0">Am primit o cerere de resetare a parolei pentru contul tau. Apasa butonul de mai jos pentru a seta o parola noua.</p>
        <p style="margin:0">Linkul este valabil <strong>1 ora</strong>.</p>
      `,
      ctaLabel: "Reseteaza parola",
      ctaUrl: opts.resetUrl,
      footerNote:
        "Daca nu tu ai cerut acest lucru, poti ignora acest email — parola ta nu se schimba.",
    }),
  }
}

export function welcomeEmail(opts: {
  fullName: string
  dashboardUrl: string
}): { subject: string; html: string } {
  return {
    subject: "Bun venit pe grile-ReziNOTE!",
    html: shell({
      preheader: "Contul tau este activ. Iti uram succes la pregatire.",
      heading: `Bun venit, ${escape(opts.fullName)}!`,
      body: `
        <p style="margin:0 0 12px 0">Contul tau este activ. Te asteapta:</p>
        <ul style="margin:0 0 16px 20px;padding:0;line-height:1.7">
          <li>Banca de grile pe capitole, actualizata constant</li>
          <li>Simulari cu cronometru real si scoring oficial</li>
          <li>Statistici detaliate dupa fiecare sesiune</li>
        </ul>
        <p style="margin:0">Daca ai intrebari, ne gasesti la <a href="mailto:support@grile-rezinote.ro" style="color:${BRAND_GREEN}">support@grile-rezinote.ro</a>.</p>
      `,
      ctaLabel: "Intra in cont",
      ctaUrl: opts.dashboardUrl,
    }),
  }
}

export function waitlistWelcomeEmail(opts: {
  code?: string | null
}): { subject: string; html: string } {
  const codeBlock = opts.code
    ? `
        <p style="margin:0 0 8px 0">Codul tau de early-bird (pastreaza-l pentru cand te abonezi):</p>
        <div style="margin:0 0 16px 0;padding:14px 16px;border:1px dashed ${BRAND_GREEN};border-radius:10px;background:#0d1f17;text-align:center">
          <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:20px;font-weight:700;letter-spacing:1px;color:${BRAND_GREEN}">${escape(opts.code)}</span>
        </div>`
    : ""

  return {
    subject: "Esti pe lista — acces early-bird la grile-ReziNOTE",
    html: shell({
      preheader:
        "Esti pe lista. La lansare primesti PREMIUM in trial + reducere la abonament.",
      heading: "Esti pe lista!",
      body: `
        <p style="margin:0 0 12px 0">Mersi ca te-ai inscris! Esti printre primii — te anuntam pe email in clipa in care deschidem.</p>
        <p style="margin:0 0 8px 0">Pentru ca ai intrat inainte de lansare, primesti <strong>acces early-bird</strong>:</p>
        <ul style="margin:0 0 16px 20px;padding:0;line-height:1.7">
          <li><strong>PREMIUM deblocat pe toata perioada de trial</strong> — inclusiv modulul de Admitere (vezi unde ai fi fost admis), nu doar PRO.</li>
          <li>Reducere la abonament cu codul de mai jos.</li>
        </ul>
        ${codeBlock}
        <p style="margin:0">Nu trebuie sa faci nimic acum. Te anuntam noi cand deschidem conturile.</p>
      `,
      footerNote: "Daca nu te-ai inscris tu pe lista, poti ignora acest email.",
    }),
  }
}

export function paymentFailedEmail(opts: {
  fullName?: string | null
  manageUrl: string
}): { subject: string; html: string } {
  const greeting = opts.fullName ? `Salut, ${escape(opts.fullName)}!` : "Salut!"
  return {
    subject: "Plata respinsa — actualizeaza metoda de plata",
    html: shell({
      preheader:
        "Ultima plata pentru abonamentul tau a esuat. Actualizeaza-ti cardul ca sa pastrezi accesul.",
      heading: "Ultima plata a esuat",
      body: `
        <p style="margin:0 0 12px 0">${greeting}</p>
        <p style="margin:0 0 12px 0">Stripe nu a putut procesa ultima plata pentru abonamentul tau. Asta se poate intampla dintr-un motiv banal — card expirat, fonduri insuficiente, banca a cerut autentificare suplimentara.</p>
        <p style="margin:0">Acceseaza pagina de gestionare ca sa actualizezi metoda de plata. Stripe va reincerca automat in zilele urmatoare.</p>
      `,
      ctaLabel: "Gestioneaza abonamentul",
      ctaUrl: opts.manageUrl,
      footerNote:
        "Daca nu actualizezi metoda de plata, abonamentul va fi suspendat dupa cateva incercari. Datele tale raman intacte.",
    }),
  }
}

export function emailChangeVerifyEmail(opts: {
  verifyUrl: string
  newEmail: string
  fullName?: string | null
}): { subject: string; html: string } {
  const greeting = opts.fullName ? `Salut, ${escape(opts.fullName)}!` : "Salut!"
  return {
    subject: "Confirma noua adresa de email",
    html: shell({
      preheader:
        "Ai cerut sa-ti schimbi adresa de email pe contul grile-ReziNOTE.",
      heading: "Confirma noua adresa de email",
      body: `
        <p style="margin:0 0 12px 0">${greeting}</p>
        <p style="margin:0 0 12px 0">Ai cerut sa schimbi adresa de email a contului in <strong>${escape(opts.newEmail)}</strong>.</p>
        <p style="margin:0">Linkul este valabil <strong>1 ora</strong>.</p>
      `,
      ctaLabel: "Confirma adresa",
      ctaUrl: opts.verifyUrl,
      footerNote:
        "Daca nu ai cerut tu acest lucru, ignora acest email — adresa actuala ramane neschimbata.",
    }),
  }
}

export function accountDeletedEmail(opts: { fullName?: string | null }): {
  subject: string
  html: string
} {
  const greeting = opts.fullName ? `Salut, ${escape(opts.fullName)}.` : "Salut."
  return {
    subject: "Contul tau a fost sters",
    html: shell({
      preheader: "Contul tau grile-ReziNOTE a fost sters definitiv.",
      heading: "Contul tau a fost sters",
      body: `
        <p style="margin:0 0 12px 0">${greeting}</p>
        <p style="margin:0 0 12px 0">Contul tau grile-ReziNOTE a fost sters definitiv impreuna cu toate datele asociate (sesiuni, raspunsuri, abonament).</p>
        <p style="margin:0">Daca ai avut un abonament activ, acesta a fost anulat. Iti multumim ca ai folosit platforma.</p>
      `,
      footerNote:
        "Daca primesti acest email fara sa fi cerut stergerea, contacteaza-ne la support@grile-rezinote.ro.",
    }),
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
