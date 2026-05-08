import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * AuthShell — primitives reutilizate de toate formele auth (login, signup,
 * forgot/update password, verify email).
 *
 * Spec § 3.1 Auth — panel `--bg-2` border `--line` radius 14, padding 36.
 */

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AuthCard({ className, ...props }: AuthCardProps) {
  return (
    <div
      data-slot="auth-card"
      className={cn(
        "rounded-[14px] border border-line bg-bg-2 p-6 sm:p-9",
        className,
      )}
      {...props}
    />
  )
}

export interface AuthHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Opțional, eyebrow mono deasupra titlului. */
  eyebrow?: React.ReactNode
}

export function AuthHeader({ title, subtitle, eyebrow }: AuthHeaderProps) {
  return (
    <div className="mb-7">
      {eyebrow && (
        <div className="mb-3 font-mono text-[11px] uppercase tracking-mono text-fg-mute">
          {eyebrow}
        </div>
      )}
      <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-fg">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[14px] leading-[1.55] text-fg-dim">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export interface AuthErrorProps {
  message: string
}

/** Panou de eroare la nivel de formular (server returnează `state.error`). */
export function AuthError({ message }: AuthErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-[7px] border border-danger/30 bg-danger/10 px-3.5 py-3 text-[13px] text-danger"
    >
      {message}
    </div>
  )
}

export interface FieldErrorProps {
  message?: string
}

/** Eroare la nivel de câmp (returnată de Zod / validare server). */
export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-[12px] text-danger" role="alert">
      {message}
    </p>
  )
}

export interface AuthDividerProps {
  label?: string
}

/** Divider orizontal cu text mono uppercase la mijloc. */
export function AuthDivider({ label = "sau" }: AuthDividerProps) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-line" />
      <span className="font-mono text-[11px] uppercase tracking-mono text-fg-mute">
        {label}
      </span>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}

export interface AuthFootLinkProps {
  prompt: string
  href: string
  cta: string
}

/** Link la nivel de pagină ("Nu ai cont? Înregistrează-te"). */
export function AuthFootLink({ prompt, href, cta }: AuthFootLinkProps) {
  return (
    <p className="mt-7 text-center text-[13px] text-fg-mute">
      {prompt}{" "}
      <Link
        href={href}
        className="font-medium text-neon underline-offset-2 hover:underline"
      >
        {cta}
      </Link>
    </p>
  )
}
