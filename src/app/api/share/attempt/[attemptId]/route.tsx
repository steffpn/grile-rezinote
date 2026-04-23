import { ImageResponse } from "next/og"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { attempts, attemptAnswers, users } from "@/lib/db/schema"

// Node runtime — the postgres-js driver we use for Drizzle is not edge-compatible.
export const runtime = "nodejs"
// Don't cache per-user-per-attempt renders; attempts don't change after completion
// but we still want auth checks to run every time.
export const dynamic = "force-dynamic"

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1920

type AttemptType = "simulation" | "practice_chapter" | "practice_mixed"

function labelForType(type: AttemptType, isMistakesMode: boolean): string {
  if (type === "simulation") return "Simulare Rezidențiat"
  if (isMistakesMode) return "Am stăpânit greșelile"
  if (type === "practice_mixed") return "Test mixt pe capitole"
  return "Test de practică"
}

function tierFromAccuracy(pct: number): {
  label: string
  accent: string
  accentSoft: string
} {
  if (pct >= 80) {
    return {
      label: "EXCELENT",
      accent: "#fbbf24", // amber-400
      accentSoft: "rgba(251,191,36,0.15)",
    }
  }
  if (pct >= 60) {
    return {
      label: "SOLID",
      accent: "#34d399", // emerald-400
      accentSoft: "rgba(52,211,153,0.15)",
    }
  }
  return {
    label: "ÎN PROGRES",
    accent: "#38bdf8", // sky-400
    accentSoft: "rgba(56,189,248,0.15)",
  }
}

function formatDateRO(date: Date): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params

  // Authorization — only the attempt owner can render the card.
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const [attempt] = await db
    .select({
      id: attempts.id,
      type: attempts.type,
      score: attempts.score,
      maxScore: attempts.maxScore,
      startedAt: attempts.startedAt,
      completedAt: attempts.completedAt,
      questionCount: attempts.questionCount,
      status: attempts.status,
      userId: attempts.userId,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, session.user.id)
      )
    )
    .limit(1)

  if (!attempt || attempt.status !== "completed") {
    return new Response("Not found", { status: 404 })
  }

  // Compute answer metrics.
  const answerRows = await db
    .select({
      questionId: attemptAnswers.questionId,
      isCorrect: attemptAnswers.isCorrect,
    })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attempt.id))

  const correctCount = answerRows.filter((a) => a.isCorrect === true).length
  const totalQuestions = attempt.questionCount ?? answerRows.length
  const accuracyPct =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0
  const score = attempt.score ?? 0
  const maxScore = attempt.maxScore ?? 0
  const scorePct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  // Detect "mistakes mode" heuristically — practice attempts with chapter IDs
  // empty and small question counts typically come from the mistakes flow.
  // (We don't persist a dedicated flag.) Good enough for a social card label.
  const isSimulation = attempt.type === "simulation"
  const isMistakesMode =
    attempt.type === "practice_mixed" &&
    (attempt.questionCount ?? 0) <= 20

  // Fetch user's first name for personalization.
  const [user] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? ""

  // Pick hero metric & sub-label based on attempt type.
  // For simulations the famous number is the point total (/950). For practice
  // the meaningful number is the accuracy % (users think in "how many did I
  // get right" terms, not points).
  const heroNumber = isSimulation ? score.toString() : `${accuracyPct}%`
  const heroSub = isSimulation
    ? `din ${maxScore} puncte · ${accuracyPct}%`
    : `${correctCount} din ${totalQuestions} corecte`

  const typeLabel = labelForType(attempt.type as AttemptType, isMistakesMode)
  const dateLabel = formatDateRO(
    attempt.completedAt ?? attempt.startedAt
  )
  const tier = tierFromAccuracy(isSimulation ? scorePct : accuracyPct)

  // Progress ring geometry for the hero circle.
  const RING_RADIUS = 340
  const STROKE = 36
  const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
  const ringPct = isSimulation ? scorePct : accuracyPct
  const progressLength = (CIRCUMFERENCE * ringPct) / 100

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          color: "white",
          fontFamily: '"Inter", system-ui, sans-serif',
          background:
            "linear-gradient(180deg, #031514 0%, #042f2e 28%, #064e3b 60%, #052428 100%)",
          position: "relative",
        }}
      >
        {/* Decorative glowing orbs */}
        <div
          style={{
            position: "absolute",
            top: "-300px",
            right: "-200px",
            width: "700px",
            height: "700px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(52,211,153,0.35) 0%, rgba(52,211,153,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-250px",
            left: "-150px",
            width: "600px",
            height: "600px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(20,184,166,0.28) 0%, rgba(20,184,166,0) 70%)",
            display: "flex",
          }}
        />
        {/* Mesh pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(16,185,129,0.10) 0%, transparent 55%)",
            display: "flex",
          }}
        />

        {/* HEADER — brand band */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Logo mark */}
            <div
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "22px",
                background:
                  "linear-gradient(135deg, #34d399 0%, #14b8a6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 40px rgba(52,211,153,0.45)",
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  display: "flex",
                }}
              >
                <span style={{ color: "white" }}>Rezi</span>
                <span style={{ color: "#34d399" }}>NOTE</span>
              </div>
              <div
                style={{
                  fontSize: "22px",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 500,
                  marginTop: "-2px",
                }}
              >
                grile-rezinote.ro
              </div>
            </div>
          </div>

          {/* Tier pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 26px",
              borderRadius: "9999px",
              background: tier.accentSoft,
              border: `2px solid ${tier.accent}`,
              color: tier.accent,
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "0.08em",
            }}
          >
            {tier.label}
          </div>
        </div>

        {/* HERO — circular progress ring with score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: "30px",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              marginBottom: "28px",
              display: "flex",
            }}
          >
            {typeLabel}
          </div>

          {/* The ring is an SVG. Score number is layered via absolute positioning. */}
          <div
            style={{
              position: "relative",
              width: "780px",
              height: "780px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="780"
              height="780"
              viewBox="0 0 780 780"
              style={{ position: "absolute", inset: 0 }}
            >
              <defs>
                <linearGradient
                  id="ringGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="50%" stopColor={tier.accent} />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx="390"
                cy="390"
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={STROKE}
              />
              {/* Progress */}
              <circle
                cx="390"
                cy="390"
                r={RING_RADIUS}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${progressLength} ${CIRCUMFERENCE}`}
                strokeDashoffset={0}
                transform="rotate(-90 390 390)"
              />
            </svg>

            {/* Center content */}
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: isSimulation ? "260px" : "220px",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #a7f3d0 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "flex",
                }}
              >
                {heroNumber}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 500,
                  marginTop: "14px",
                  display: "flex",
                }}
              >
                {heroSub}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER — stats row + tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "36px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Stat cards */}
          <div
            style={{
              display: "flex",
              gap: "20px",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "24px 28px",
                borderRadius: "22px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                Răspunsuri
              </div>
              <div
                style={{
                  fontSize: "44px",
                  fontWeight: 800,
                  color: "white",
                  marginTop: "8px",
                  display: "flex",
                }}
              >
                {correctCount}
                <span
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    fontSize: "30px",
                    marginLeft: "10px",
                    alignSelf: "flex-end",
                    marginBottom: "6px",
                    display: "flex",
                  }}
                >
                  / {totalQuestions}
                </span>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "24px 28px",
                borderRadius: "22px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                {isSimulation ? "Punctaj" : "Acuratețe"}
              </div>
              <div
                style={{
                  fontSize: "44px",
                  fontWeight: 800,
                  color: "white",
                  marginTop: "8px",
                  display: "flex",
                }}
              >
                {isSimulation ? `${score}` : `${accuracyPct}%`}
                {isSimulation && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontWeight: 600,
                      fontSize: "30px",
                      marginLeft: "10px",
                      alignSelf: "flex-end",
                      marginBottom: "6px",
                      display: "flex",
                    }}
                  >
                    / {maxScore}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "24px 28px",
                borderRadius: "22px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                Dată
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "white",
                  marginTop: "14px",
                  display: "flex",
                  flexWrap: "wrap",
                }}
              >
                {dateLabel}
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "white",
                display: "flex",
                textAlign: "center",
              }}
            >
              {firstName
                ? `Pregătire serioasă, ${firstName}.`
                : "Pregătire serioasă pentru rezidențiat."}
            </div>
            <div
              style={{
                fontSize: "22px",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 500,
                display: "flex",
              }}
            >
              Grile · Simulări · Statistici — grile-rezinote.ro
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      headers: {
        // Let browsers cache the rendered PNG briefly; auth runs before generation.
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="rezinote-${attempt.id.slice(0, 8)}.png"`,
      },
    }
  )
}
