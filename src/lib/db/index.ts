import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

// Connection pooling: disable prepared statements for Supabase transaction mode
const client = postgres(connectionString, {
  prepare: false,
  max: 20,
  idle_timeout: 30,
})

export const db = drizzle(client, { schema })
