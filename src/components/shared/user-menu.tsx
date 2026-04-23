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
  /** Optional style override for the trigger button (e.g., when placed on a
   *  dark marketing page vs. the white dashboard header). */
  variant?: "default" | "marketing"
}

/**
 * Avatar button that opens a dropdown menu with the user's email, links to
 * profile and subscription, and the logout action. Shared between the
 * app-shell nav header and the marketing layout header so a logged-in user
 * sees a consistent identity indicator on every page.
 */
export function UserMenu({ userEmail, variant = "default" }: UserMenuProps) {
  const emailPrefix = userEmail.split("@")[0] ?? ""
  const initials =
    (userEmail[0]?.toUpperCase() ?? "") +
    (emailPrefix.split(/[._-]/)[1]?.[0]?.toUpperCase() ?? "")

  const triggerClass =
    variant === "marketing"
      ? "group inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/20 transition-all hover:bg-white/15 hover:ring-white/40"
      : "group inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20 transition-all hover:from-emerald-500/30 hover:to-teal-500/30 hover:ring-emerald-500/40 dark:text-emerald-300"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Meniu cont" className={triggerClass}>
          {initials || <CircleUser className="h-5 w-5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">Autentificat ca</p>
          <p className="truncate text-sm font-medium">{userEmail}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserCircle2 className="mr-2 h-4 w-4" />
            Profilul meu
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/subscription" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            Abonament
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="w-full cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Deconectare
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
