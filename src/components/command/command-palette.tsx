"use client"

import { Command } from "cmdk"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Moon,
  Rocket,
  Sparkles,
  Sun,
  Tag,
  Target,
  User,
  Wallet,
} from "lucide-react"
import { useCallback } from "react"
import { useCommandPalette } from "./use-command-palette"

type Action = () => void

interface Item {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  perform: Action
  keywords?: string
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const close = useCallback(() => setOpen(false), [setOpen])

  const go = useCallback(
    (href: string) => () => {
      close()
      router.push(href)
    },
    [router, close],
  )

  const navigation: Item[] = [
    { id: "nav-dashboard", label: "Dashboard", icon: LayoutDashboard, perform: go("/dashboard") },
    { id: "nav-practice", label: "Practica", icon: Target, perform: go("/practice"), keywords: "practice exersare" },
    { id: "nav-exam", label: "Examen", icon: GraduationCap, perform: go("/exam") },
    { id: "nav-admission", label: "Admitere", icon: Rocket, perform: go("/admission") },
    { id: "nav-subscription", label: "Abonament", icon: Wallet, perform: go("/subscription") },
    { id: "nav-pricing", label: "Preturi", icon: Tag, perform: go("/pricing"), keywords: "pricing pret" },
  ]

  const actions: Item[] = [
    {
      id: "act-quick-exam",
      label: "Start examen rapid",
      icon: Sparkles,
      perform: go("/exam?quick=1"),
    },
    {
      id: "act-stats",
      label: "Vezi statistici",
      icon: BarChart3,
      perform: go("/dashboard?tab=stats"),
    },
    {
      id: "act-theme",
      label: theme === "dark" ? "Schimba tema (light)" : "Schimba tema (dark)",
      icon: theme === "dark" ? Sun : Moon,
      perform: () => {
        setTheme(theme === "dark" ? "light" : "dark")
        close()
      },
      keywords: "theme tema dark light intuneric luminos",
    },
  ]

  const account: Item[] = [
    { id: "acc-profile", label: "Profilul meu", icon: User, perform: go("/profile") },
    { id: "acc-logout", label: "Logout", icon: LogOut, perform: go("/logout"), keywords: "iesire deconectare" },
  ]

  const renderItem = (item: Item) => {
    const Icon = item.icon
    return (
      <Command.Item
        key={item.id}
        value={`${item.label} ${item.keywords ?? ""}`}
        onSelect={() => item.perform()}
        className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 outline-none transition-colors data-[selected=true]:bg-emerald-500/10 data-[selected=true]:text-foreground"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/5 bg-white/5 text-emerald-400 transition-colors group-data-[selected=true]:border-emerald-400/30 group-data-[selected=true]:bg-emerald-500/15">
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1">{item.label}</span>
        {item.shortcut && (
          <kbd className="ml-auto rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {item.shortcut}
          </kbd>
        )}
      </Command.Item>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          label="Paleta de comenzi"
          shouldFilter
          className="fixed inset-0 z-[200]"
          loop
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={close}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[18%] w-[92vw] max-w-xl -translate-x-1/2"
          >
            <div className="relative rounded-2xl p-[1px]">
              <div
                className="absolute inset-0 rounded-2xl opacity-80"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(16,185,129,0.55) 0%, rgba(20,184,166,0.25) 40%, rgba(6,182,212,0.45) 100%)",
                }}
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[rgba(10,14,20,0.92)] shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/5 px-3">
                  <Command.Input
                    autoFocus
                    placeholder="Cauta sau scrie o comanda..."
                    className="h-12 w-full bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  />
                </div>
                <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                  <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Niciun rezultat.
                  </Command.Empty>

                  <Command.Group
                    heading="Navigare"
                    className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {navigation.map(renderItem)}
                  </Command.Group>

                  <Command.Group
                    heading="Actiuni"
                    className="mt-1 px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {actions.map(renderItem)}
                  </Command.Group>

                  <Command.Group
                    heading="Cont"
                    className="mt-1 px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {account.map(renderItem)}
                  </Command.Group>
                </Command.List>

                <div className="flex items-center justify-between gap-2 border-t border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">Esc</kbd>
                    <span>inchide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">Ctrl</kbd>
                    <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">K</kbd>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  )
}
