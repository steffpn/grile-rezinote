"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, BookOpen, TrendingUp, History, Trophy, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

const navItems = [
  { href: "/dashboard/overview", label: "Sumar", icon: BarChart3 },
  { href: "/dashboard/chapters", label: "Capitole", icon: BookOpen },
  { href: "/dashboard/trends", label: "Tendinte", icon: TrendingUp },
  { href: "/dashboard/history", label: "Istoric", icon: History },
  { href: "/dashboard/ranking", label: "Clasament", icon: Trophy },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile: Sheet-based sidebar */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Meniu navigare</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 pt-10">
            <NavLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-20 p-4">
          <h2 className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Dashboard</h2>
          <NavLinks />
        </div>
      </aside>
    </>
  )
}
