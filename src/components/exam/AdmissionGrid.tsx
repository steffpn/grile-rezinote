import { cn } from "@/lib/utils"

export interface AdmissionEntry {
  /** Universitatea — ex: "UMF Carol Davila". */
  umf: string
  /** Specialitatea. */
  specialty: string
  /** Pragul de admitere ediția curentă. */
  threshold: number
  /** Locuri disponibile. */
  seats: number
  /** Marja ta vs prag (delta). */
  margin: number
}

interface AdmissionGridProps {
  /** Lista de specialitate × umf. Ordine: cei admiși primii. */
  entries: AdmissionEntry[]
  /** Anul referință pentru praguri. */
  year?: string
}

/**
 * AdmissionGrid — 6 UMF cards (3×2) ca în killer section din landing.
 * Fiecare card afișează status (admis/sub prag), specialitate mare, statistici
 * mono (prag, marja, locuri).
 *
 * Spec § 6 Killer section (umf-grid).
 */
export function AdmissionGrid({ entries, year = "'25" }: AdmissionGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => {
        const admitted = entry.margin >= 0
        return (
          <div
            key={`${entry.umf}-${entry.specialty}`}
            className={cn(
              "rounded-[12px] border bg-bg-2 p-5 transition-colors",
              admitted
                ? "border-neon/40 [background:radial-gradient(ellipse_at_top_right,oklch(0.84_0.21_162/0.06),transparent_70%),var(--bg-2)]"
                : "border-line",
            )}
          >
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-medium text-fg-dim">
                {entry.umf}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono-tight",
                  admitted
                    ? "bg-neon/15 text-neon"
                    : "bg-bg-3 text-fg-mute",
                )}
              >
                {admitted ? "admis" : `${entry.margin}`}
              </span>
            </div>

            <div className="mb-4 text-[18px] font-semibold leading-tight tracking-[-0.02em] text-fg">
              {entry.specialty}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-dashed border-line pt-3.5">
              <Stat
                label={`prag ${year}`}
                value={entry.threshold.toString()}
              />
              <Stat
                label="marja ta"
                value={
                  entry.margin >= 0 ? `+${entry.margin}` : `${entry.margin}`
                }
                tone={admitted ? "pos" : "danger"}
              />
              <Stat label="locuri" value={entry.seats.toString()} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "pos" | "danger"
}) {
  return (
    <div className="font-mono text-[11px] text-fg-mute">
      <div
        className={cn(
          "mb-0.5 text-[18px] font-medium leading-none",
          tone === "pos" && "text-neon",
          tone === "danger" && "text-danger",
          tone === "default" && "text-fg",
        )}
      >
        {value}
      </div>
      <div className="uppercase tracking-mono-tight">{label}</div>
    </div>
  )
}
