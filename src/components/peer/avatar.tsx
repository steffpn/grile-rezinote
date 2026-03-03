"use client"

/**
 * Deterministic anonymous avatar component.
 * Uses userId as seed to generate consistent colors and shapes.
 * No PII exposed — just decorative visual identity.
 */

interface AvatarProps {
  seed: string
  size?: number
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

// Warm, friendly colors for avatars
const AVATAR_COLORS = [
  "#4CAF50", "#2196F3", "#FF9800", "#9C27B0",
  "#00BCD4", "#FF5722", "#3F51B5", "#E91E63",
  "#009688", "#FFC107", "#673AB7", "#03A9F4",
  "#8BC34A", "#F44336", "#00ACC1", "#7C4DFF",
]

const SHAPES = ["circle", "diamond", "square", "triangle"] as const

export function PeerAvatar({ seed, size = 32 }: AvatarProps) {
  const hash = hashString(seed)
  const colorIndex = hash % AVATAR_COLORS.length
  const shapeIndex = (hash >> 4) % SHAPES.length
  const color = AVATAR_COLORS[colorIndex]
  const shape = SHAPES[shapeIndex]

  const half = size / 2
  const quarter = size / 4

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-full"
      style={{ backgroundColor: color + "20" }}
    >
      {shape === "circle" && (
        <circle cx={half} cy={half} r={quarter} fill={color} />
      )}
      {shape === "diamond" && (
        <polygon
          points={`${half},${quarter} ${half + quarter},${half} ${half},${half + quarter} ${half - quarter},${half}`}
          fill={color}
        />
      )}
      {shape === "square" && (
        <rect
          x={quarter}
          y={quarter}
          width={half}
          height={half}
          rx={2}
          fill={color}
        />
      )}
      {shape === "triangle" && (
        <polygon
          points={`${half},${quarter} ${half + quarter},${half + quarter} ${half - quarter},${half + quarter}`}
          fill={color}
        />
      )}
    </svg>
  )
}
