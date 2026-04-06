"use client"

import { useEffect, useState } from "react"

export function AuroraBackground() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Conic aurora layer 1 */}
      <div
        className={`absolute -top-1/2 left-1/2 h-[1200px] w-[1200px] -translate-x-1/2 rounded-full opacity-40 blur-[120px] ${
          reduced ? "" : "aurora-spin-slow"
        }`}
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(16,185,129,0.35) 20%, transparent 40%, rgba(20,184,166,0.30) 60%, transparent 80%, rgba(6,182,212,0.25) 100%)",
        }}
      />

      {/* Conic aurora layer 2 (counter-rotating) */}
      <div
        className={`absolute -bottom-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full opacity-30 blur-[100px] ${
          reduced ? "" : "aurora-spin-reverse"
        }`}
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, transparent 0%, rgba(20,184,166,0.4) 25%, transparent 50%, rgba(16,185,129,0.3) 75%, transparent 100%)",
        }}
      />

      {/* Floating blobs */}
      <div
        className={`absolute left-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-emerald-500/[0.12] blur-[100px] ${
          reduced ? "" : "aurora-float-a"
        }`}
      />
      <div
        className={`absolute right-[8%] top-[35%] h-[500px] w-[500px] rounded-full bg-teal-500/[0.10] blur-[110px] ${
          reduced ? "" : "aurora-float-b"
        }`}
      />
      <div
        className={`absolute bottom-[10%] left-[30%] h-[450px] w-[450px] rounded-full bg-cyan-500/[0.08] blur-[100px] ${
          reduced ? "" : "aurora-float-c"
        }`}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050508] to-transparent" />

      <style jsx>{`
        @keyframes aurora-spin-slow {
          from {
            transform: translateX(-50%) rotate(0deg);
          }
          to {
            transform: translateX(-50%) rotate(360deg);
          }
        }
        @keyframes aurora-spin-reverse {
          from {
            transform: translateX(-50%) rotate(360deg);
          }
          to {
            transform: translateX(-50%) rotate(0deg);
          }
        }
        @keyframes aurora-float-a {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(60px, 40px) scale(1.1);
          }
        }
        @keyframes aurora-float-b {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-50px, 60px) scale(1.15);
          }
        }
        @keyframes aurora-float-c {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(40px, -40px) scale(1.05);
          }
        }
        .aurora-spin-slow {
          animation: aurora-spin-slow 40s linear infinite;
        }
        .aurora-spin-reverse {
          animation: aurora-spin-reverse 50s linear infinite;
        }
        .aurora-float-a {
          animation: aurora-float-a 18s ease-in-out infinite;
        }
        .aurora-float-b {
          animation: aurora-float-b 22s ease-in-out infinite;
        }
        .aurora-float-c {
          animation: aurora-float-c 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
