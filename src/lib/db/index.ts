import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Singleton prevents connection leaks from Next.js hot reloads in dev mode
const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle<typeof schema>> }

function createDb() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 3 })
  return drizzle(client, { schema })
}

export const db = globalForDb.db ?? (globalForDb.db = createDb())
