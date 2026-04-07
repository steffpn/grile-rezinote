import Link from "next/link"
import { Stethoscope } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#050508]">
      {/* Left panel — decorative */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* Gradient mesh background */}
        <div className="absolute inset-0">
          <div className="absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.12] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/[0.08] blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.06] blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Rezi</span>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">NOT</span>
            </span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight text-white/90">
              Pregateste-te pentru{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                succesul
              </span>{" "}
              la rezidentiat
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/40">
              Simuleaza examene reale, urmareste-ti progresul si compara
              scorurile cu pragurile istorice de admitere.
            </p>

            {/* Testimonial / stat card */}
            <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-white">200</span>
                <span className="text-sm text-white/40">intrebari per simulare</span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-white">950</span>
                <span className="text-sm text-white/40">punctaj maxim posibil</span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-emerald-400">100%</span>
                <span className="text-sm text-white/40">formula oficiala de scoring</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} ReziNOT. Toate drepturile rezervate.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center sm:mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-white">Rezi</span>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">NOT</span>
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
