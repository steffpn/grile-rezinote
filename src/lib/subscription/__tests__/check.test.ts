import { describe, it, expect, vi, beforeEach } from "vitest"
import { isTrialActive, getTrialDaysRemaining } from "../trial"

// Note: checkSubscriptionAccess uses DB queries, so we test it with mocked DB.
// Trial utility functions are pure and can be tested directly.

describe("trial utilities", () => {
  describe("isTrialActive", () => {
    it("returns false for null trialStartedAt", () => {
      expect(isTrialActive(null)).toBe(false)
    })

    it("returns true when trial started recently", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      expect(isTrialActive(twoDaysAgo)).toBe(true)
    })

    it("returns false when trial started more than 7 days ago", () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      expect(isTrialActive(eightDaysAgo)).toBe(false)
    })

    it("returns true on exactly the 7th day", () => {
      // 6.5 days ago — still within 7-day window
      const sixAndHalfDaysAgo = new Date(
        Date.now() - 6.5 * 24 * 60 * 60 * 1000
      )
      expect(isTrialActive(sixAndHalfDaysAgo)).toBe(true)
    })
  })

  describe("getTrialDaysRemaining", () => {
    it("returns correct days for fresh trial", () => {
      const now = new Date()
      const remaining = getTrialDaysRemaining(now)
      expect(remaining).toBe(7)
    })

    it("returns fewer days for mid-trial", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const remaining = getTrialDaysRemaining(threeDaysAgo)
      expect(remaining).toBe(4)
    })

    it("returns 0 for expired trial", () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const remaining = getTrialDaysRemaining(tenDaysAgo)
      expect(remaining).toBe(0)
    })

    it("never returns negative values", () => {
      const longAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
      const remaining = getTrialDaysRemaining(longAgo)
      expect(remaining).toBe(0)
    })
  })
})

// Tests for checkSubscriptionAccess with mocked DB
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ column: col, value: val })),
}))

vi.mock("@/lib/db/schema", () => ({
  subscriptions: {
    userId: "user_id",
    status: "status",
    currentPeriodEnd: "current_period_end",
    cancelAtPeriodEnd: "cancel_at_period_end",
    planType: "plan_type",
    planTier: "plan_tier",
  },
  users: {
    id: "id",
    trialStartedAt: "trial_started_at",
  },
}))

vi.mock("@/lib/stripe/config", () => ({
  STRIPE_CONFIG: {
    trialDays: 7,
  },
}))

import { db } from "@/lib/db"
import { checkSubscriptionAccess } from "../check"

function createMockChain(resolvedValue: unknown[] = []) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(resolvedValue),
  }
  return chain
}

describe("checkSubscriptionAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns active for user with active subscription", async () => {
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const chain = createMockChain([
      {
        status: "active",
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        planType: "monthly",
        planTier: "PRO",
      },
    ])
    vi.mocked(db.select).mockReturnValue(chain as never)

    const result = await checkSubscriptionAccess("user-1")

    expect(result.hasAccess).toBe(true)
    expect(result.status).toBe("active")
    expect(result.planType).toBe("monthly")
    expect(result.tier).toBe("PRO")
  })

  it("returns trialing for user with active Stripe trial", async () => {
    const trialEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    // First call: subscriptions query returns trialing
    const subChain = createMockChain([
      {
        status: "trialing",
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        planType: null,
        planTier: "PRO",
      },
    ])
    vi.mocked(db.select).mockReturnValue(subChain as never)

    const result = await checkSubscriptionAccess("user-2")

    expect(result.hasAccess).toBe(true)
    expect(result.status).toBe("trialing")
    expect(result.trialDaysRemaining).toBeGreaterThan(0)
  })

  it("returns trial_available for user who never started trial", async () => {
    // First call: no subscription
    const subChain = createMockChain([])
    // Second call: user with no trial
    const userChain = createMockChain([{ trialStartedAt: null }])

    vi.mocked(db.select)
      .mockReturnValueOnce(subChain as never)
      .mockReturnValueOnce(userChain as never)

    const result = await checkSubscriptionAccess("user-3")

    expect(result.hasAccess).toBe(true)
    expect(result.status).toBe("trial_available")
  })

  it("returns expired (as FREE tier) for user whose trial has expired", async () => {
    // Semantic change: expired trial no longer locks the user out. They drop
    // to the FREE tier (20 questions/day) and hasAccess stays true. Feature
    // gating is done per-tier, not via hasAccess anymore.
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const subChain = createMockChain([])
    const userChain = createMockChain([{ trialStartedAt: tenDaysAgo }])

    vi.mocked(db.select)
      .mockReturnValueOnce(subChain as never)
      .mockReturnValueOnce(userChain as never)

    const result = await checkSubscriptionAccess("user-4")

    expect(result.hasAccess).toBe(true)
    expect(result.status).toBe("expired")
    expect(result.tier).toBe("FREE")
  })

  it("returns trialing for user in active server-side trial", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const subChain = createMockChain([])
    const userChain = createMockChain([{ trialStartedAt: twoDaysAgo }])

    vi.mocked(db.select)
      .mockReturnValueOnce(subChain as never)
      .mockReturnValueOnce(userChain as never)

    const result = await checkSubscriptionAccess("user-5")

    expect(result.hasAccess).toBe(true)
    expect(result.status).toBe("trialing")
    expect(result.trialDaysRemaining).toBe(5)
  })

  it("returns none for non-existent user", async () => {
    const subChain = createMockChain([])
    const userChain = createMockChain([])

    vi.mocked(db.select)
      .mockReturnValueOnce(subChain as never)
      .mockReturnValueOnce(userChain as never)

    const result = await checkSubscriptionAccess("unknown-user")

    expect(result.hasAccess).toBe(false)
    expect(result.status).toBe("none")
  })
})
