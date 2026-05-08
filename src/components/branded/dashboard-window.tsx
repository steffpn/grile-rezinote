"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface DashboardWindowTab {
  /** ID-ul tab-ului (folosit la onTabChange). */
  id: string
  /** Eticheta vizibilă. */
  label: React.ReactNode
}

export interface DashboardWindowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Titlul textual din titlebar (ex: "simulare-21oct.tsx · last attempt"). */
  title?: React.ReactNode
  /** Tab-urile din titlebar (centru). */
  tabs?: DashboardWindowTab[]
  /** Tab-ul activ (ID). */
  activeTab?: string
  /** Callback la schimbare tab. */
  onTabChange?: (tabId: string) => void
  /** Slot dreapta — status (ex: dot + "finalizat 14:23"). */
  status?: React.ReactNode
  /** Ascunde traffic-light dots-urile (default: vizibile). */
  hideTrafficDots?: boolean
  /** Stil container suplimentar (intern body). */
  bodyClassName?: string
}

/**
 * DashboardWindow — chrome IDE-style cu titlebar (traffic dots + tabs + status).
 *
 * Spec: § 4 Dashboard mock — folosit ca refelajul pentru orice ecran care
 * vrea aspectul de "fereastră de cod" (rezultat simulare, statistici, admin
 * tables, results overview).
 *
 * Children sunt randate într-o zonă de body cu `--panel` și separator de
 * 1px între cells dacă folosești grid-ul de body intern.
 */
export function DashboardWindow({
  className,
  title,
  tabs,
  activeTab,
  onTabChange,
  status,
  hideTrafficDots = false,
  bodyClassName,
  children,
  ...props
}: DashboardWindowProps) {
  return (
    <div
      data-slot="dashboard-window"
      className={cn(
        "overflow-hidden rounded-[14px] border border-line bg-panel shadow-dashboard",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line bg-bg-2 px-[18px] py-3 font-mono text-[12px] text-fg-mute">
        <div className="flex min-w-0 items-center gap-2.5">
          {!hideTrafficDots && (
            <div className="flex shrink-0 gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-line-2" />
              <span className="size-2.5 rounded-full bg-line-2" />
              <span className="size-2.5 rounded-full bg-line-2" />
            </div>
          )}
          {title != null && <span className="truncate">{title}</span>}
        </div>

        {tabs && tabs.length > 0 && (
          <div className="flex shrink-0 gap-4 text-[12px]" role="tablist">
            {tabs.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-active={active || undefined}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    "border-b border-transparent py-1 transition-colors",
                    active
                      ? "border-b-neon text-neon"
                      : "text-fg-mute hover:text-fg-dim",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {status != null && (
          <div className="flex shrink-0 items-center gap-1.5">{status}</div>
        )}
      </div>

      <div className={cn("bg-panel", bodyClassName)}>{children}</div>
    </div>
  )
}

export interface DashboardWindowGridProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Numărul de coloane (default 4). */
  cols?: number
}

/**
 * DashboardWindowGrid — grid intern pentru body cu separatori de 1px între
 * celule. Folosește `gap: 1px` peste un fundal `--line` ca să creeze liniile.
 *
 * Spec: § 4 Body grid 4×2 cu `gap: 1px` și background `--line`.
 */
export function DashboardWindowGrid({
  className,
  cols = 4,
  children,
  ...props
}: DashboardWindowGridProps) {
  return (
    <div
      data-slot="dashboard-window-grid"
      className={cn("grid gap-px bg-line", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      {...props}
    >
      {children}
    </div>
  )
}

export interface DashboardWindowCellProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Câte coloane span-uiește. */
  colSpan?: number
}

/**
 * DashboardWindowCell — celulă cu padding 22, fundal `--panel`. Acceptă
 * `colSpan` pentru cell-uri care se întind pe mai multe coloane (ex:
 * cell-score peste 2 coloane, cell-chart peste 2 coloane).
 */
export function DashboardWindowCell({
  className,
  colSpan,
  style,
  children,
  ...props
}: DashboardWindowCellProps) {
  return (
    <div
      data-slot="dashboard-window-cell"
      className={cn("bg-panel p-[22px] min-w-0", className)}
      style={{
        gridColumn: colSpan && colSpan > 1 ? `span ${colSpan}` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
