"use client"

import Link from "next/link"
import {
  CircleUser,
  CreditCard,
  LogOut,
  UserCircle2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth/actions"

interface UserMenuProps {
  userEmail: string
  /**
   * Variant pentru contexte cu fundal mai luminos (legacy: marketing pe v1
   * landing-ul vechi — păstrat pentru compat).
   */
  variant?: "default" | "marketing"
}

/**
 * Avatar trigger care deschide un dropdown cu email-ul, link-uri profile /
 * subscription și logout. Folosit în sidebar footer + (legacy) marketing nav.
 */
export function UserMenu({ userEmail, variant = "default" }: UserMenuProps) {
  const emailPrefix = userEmail.split("@")[0] ?? ""
  const initials =
    (userEmail[0]?.toUpperCase() ?? "") +
    (emailPrefix.split(/[._-]/)[1]?.[0]?.toUpperCase() ?? "")

  const triggerClass =
    variant === "marketing"
      ? "group inline-flex size-9 items-center justify-center rounded-full bg-bg-3 text-[13px] font-mono font-medium text-fg ring-1 ring-line transition-colors hover:bg-bg-2 hover:ring-line-2"
      : "group inline-flex size-8 items-center justify-center rounded-full bg-neon/12 text-[12px] font-mono font-semibold text-neon ring-1 ring-neon/24 transition-colors hover:bg-neon/16 hover:ring-neon/40"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Meniu cont" className={triggerClass}>
          {initials || <CircleUser className="size-5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60 border-line bg-bg-2 p-1 text-fg"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="font-mono text-[10.5px] uppercase tracking-mono text-fg-mute">
            Autentificat ca
          </p>
          <p className="mt-1 truncate text-[13px] font-medium text-fg">
            {userEmail}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem asChild className="text-fg-dim focus:bg-bg-3 focus:text-fg">
          <Link href="/profile" className="cursor-pointer">
            <UserCircle2 className="mr-2 size-4" />
            Profilul meu
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-fg-dim focus:bg-bg-3 focus:text-fg">
          <Link href="/subscription" className="cursor-pointer">
            <CreditCard className="mr-2 size-4" />
            Abonament
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-line" />
        <form action={logout}>
          <DropdownMenuItem asChild className="text-danger focus:bg-danger/10 focus:text-danger">
            <button type="submit" className="w-full cursor-pointer">
              <LogOut className="mr-2 size-4" />
              Deconectare
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
