import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ column: col, value: val })),
}))

vi.mock("@/lib/db/schema", () => ({
  subscriptions: {
    stripeCustomerId: "stripe_customer_id",
    stripeSubscriptionId: "stripe_subscription_id",
    status: "status",
    planType: "plan_type",
    cancelAtPeriodEnd: "cancel_at_period_end",
    currentPeriodEnd: "current_period_end",
  },
}))

import { db } from "@/lib/db"
import {
  handleSubscriptionChange,
  handleSubscriptionDeleted,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from "../webhook-handlers"

function createMockChain() {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  }
  return chain
}

describe("webhook-handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("handleSubscriptionChange", () => {
    it("updates subscription record for active subscription", async () => {
      const selectChain = createMockChain()
      selectChain.limit.mockResolvedValue([
        { id: "sub-1", stripeCustomerId: "cus_123" },
      ])
      vi.mocked(db.select).mockReturnValue(selectChain as never)

      const updateChain = createMockChain()
      vi.mocked(db.update).mockReturnValue(updateChain as never)

      const subscription = {
        id: "sub_stripe_123",
        customer: "cus_123",
        status: "active" as const,
        cancel_at_period_end: false,
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
              price: {
                recurring: { interval: "month" as const },
              },
            },
          ],
        },
      }

      await handleSubscriptionChange(subscription as never)

      expect(db.update).toHaveBeenCalled()
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeSubscriptionId: "sub_stripe_123",
          status: "active",
          planType: "monthly",
          cancelAtPeriodEnd: false,
        })
      )
    })

    it("maps Stripe trialing status correctly", async () => {
      const selectChain = createMockChain()
      selectChain.limit.mockResolvedValue([
        { id: "sub-1", stripeCustomerId: "cus_123" },
      ])
      vi.mocked(db.select).mockReturnValue(selectChain as never)

      const updateChain = createMockChain()
      vi.mocked(db.update).mockReturnValue(updateChain as never)

      const subscription = {
        id: "sub_stripe_456",
        customer: "cus_123",
        status: "trialing" as const,
        cancel_at_period_end: false,
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 7,
              price: {
                recurring: { interval: "year" as const },
              },
            },
          ],
        },
      }

      await handleSubscriptionChange(subscription as never)

      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "trialing",
          planType: "annual",
        })
      )
    })

    it("maps Stripe canceled status to local cancelled", async () => {
      const selectChain = createMockChain()
      selectChain.limit.mockResolvedValue([
        { id: "sub-1", stripeCustomerId: "cus_123" },
      ])
      vi.mocked(db.select).mockReturnValue(selectChain as never)

      const updateChain = createMockChain()
      vi.mocked(db.update).mockReturnValue(updateChain as never)

      const subscription = {
        id: "sub_stripe_789",
        customer: "cus_123",
        status: "canceled" as const,
        cancel_at_period_end: false,
        items: { data: [{ current_period_end: Math.floor(Date.now() / 1000), price: { recurring: { interval: "month" as const } } }] },
      }

      await handleSubscriptionChange(subscription as never)

      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
        })
      )
    })

    it("skips when customer not found in database", async () => {
      const selectChain = createMockChain()
      selectChain.limit.mockResolvedValue([]) // No matching record
      vi.mocked(db.select).mockReturnValue(selectChain as never)

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const subscription = {
        id: "sub_unknown",
        customer: "cus_unknown",
        status: "active" as const,
        cancel_at_period_end: false,
        items: { data: [] },
      }

      await handleSubscriptionChange(subscription as never)

      expect(db.update).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("cus_unknown")
      )

      consoleSpy.mockRestore()
    })
  })

  describe("handleSubscriptionDeleted", () => {
    it("sets status to cancelled", async () => {
      const updateChain = createMockChain()
      vi.mocked(db.update).mockReturnValue(updateChain as never)

      const subscription = {
        id: "sub_del",
        customer: "cus_del",
        status: "canceled" as const,
      }

      await handleSubscriptionDeleted(subscription as never)

      expect(db.update).toHaveBeenCalled()
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          cancelAtPeriodEnd: false,
        })
      )
    })
  })

  describe("handlePaymentSucceeded", () => {
    it("sets subscription status to active", async () => {
      const updateChain = createMockChain()
      vi.mocked(db.update).mockReturnValue(updateChain as never)

      const invoice = {
        id: "inv_123",
        parent: {
          type: "subscription_details",
          subscription_details: {
            subscription: "sub_pay_ok",
          },
        },
      }

      await handlePaymentSucceeded(invoice as never)

      expect(db.update).toHaveBeenCalled()
      expect(updateChain.set).toHaveBeenCalledWith({ status: "active" })
    })

    it("skips when no subscription on invoice", async () => {
      const invoice = {
        id: "inv_no_sub",
        parent: null,
      }

      await handlePaymentSucceeded(invoice as never)

      expect(db.update).not.toHaveBeenCalled()
    })
  })

  describe("handlePaymentFailed", () => {
    it("logs warning for failed payment", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const invoice = {
        id: "inv_fail",
        parent: {
          type: "subscription_details",
          subscription_details: {
            subscription: "sub_fail",
          },
        },
      }

      await handlePaymentFailed(invoice as never)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("sub_fail")
      )

      consoleSpy.mockRestore()
    })
  })
})
