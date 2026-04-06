import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core"

// Enums
export const questionTypeEnum = pgEnum("question_type", ["CS", "CM"])

export const attemptTypeEnum = pgEnum("attempt_type", [
  "practice_chapter",
  "practice_mixed",
  "simulation",
])

export const userRoleEnum = pgEnum("user_role", ["student", "admin"])

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "cancelled",
  "inactive",
])

// Tables

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  yearOfStudy: integer("year_of_study"), // 1-6, nullable for admin users
  role: userRoleEnum("role").notNull().default("student"),
  isSuperadmin: boolean("is_superadmin").notNull().default(false),
  peerOptIn: boolean("peer_opt_in").notNull().default(false), // opt-in for anonymous peer rankings
  trialStartedAt: timestamp("trial_started_at"), // set on first paid feature access
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Persistent record of accounts that have already consumed a free trial.
// Survives user deletion to prevent trial reset abuse via re-signup with the same email.
export const trialHistory = pgTable("trial_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailHash: text("email_hash").notNull().unique(), // SHA-256 of normalized email
  firstUsedAt: timestamp("first_used_at").defaultNow().notNull(),
})

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const chapters = pgTable("chapters", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  chapterId: uuid("chapter_id")
    .references(() => chapters.id)
    .notNull(),
  text: text("text").notNull(),
  type: questionTypeEnum("type").notNull(),
  sourceBook: text("source_book"),
  sourcePage: text("source_page"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const options = pgTable("options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label").notNull(), // 'A', 'B', 'C', 'D', 'E'
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
})

export const attempts = pgTable("attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  type: attemptTypeEnum("type").notNull(),
  score: integer("score"),
  maxScore: integer("max_score"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  timeLimit: integer("time_limit"), // seconds, null for practice
  feedbackMode: text("feedback_mode").default("deferred"), // 'immediate' | 'deferred'
  chapterIds: text("chapter_ids").array(), // which chapters were selected
  questionCount: integer("question_count"), // how many questions requested
  questionOrder: text("question_order").array(), // ordered question IDs snapshot at creation
  status: text("status").default("in_progress"), // 'in_progress' | 'completed' | 'abandoned'
  shuffleSeed: integer("shuffle_seed"), // deterministic option shuffling per exam
})

export const attemptAnswers = pgTable("attempt_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .references(() => attempts.id, { onDelete: "cascade" })
    .notNull(),
  questionId: uuid("question_id")
    .references(() => questions.id)
    .notNull(),
  selectedOptions: text("selected_options").array(), // ['A', 'C']
  isCorrect: boolean("is_correct"), // snapshot at submission time
  score: integer("score"), // per-question score at submission time
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
})

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: subscriptionStatusEnum("status").notNull().default("inactive"),
  planType: text("plan_type"), // 'monthly' | 'annual'
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const specialties = pgTable("specialties", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const admissionData = pgTable("admission_data", {
  id: uuid("id").defaultRandom().primaryKey(),
  specialtyId: uuid("specialty_id")
    .references(() => specialties.id)
    .notNull(),
  specialty: text("specialty").notNull(), // denormalized name for display
  year: integer("year").notNull(),
  thresholdScore: integer("threshold_score").notNull(),
  availableSpots: integer("available_spots").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(), // "create" | "update" | "delete" | "restore" | "reorder"
  entityType: text("entity_type").notNull(), // "chapter" | "question"
  entityId: uuid("entity_id").notNull(),
  changes: text("changes"), // JSON string of changes made
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
})

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
