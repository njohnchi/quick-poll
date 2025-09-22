import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '@/server/db/drizzle-schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDb() {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to your .env')
  }
  const client = postgres(url, {
    ssl: 'require',
    max: 1,
  })
  _db = drizzle(client, { schema })
  return _db
}

export function useDbSchema() {
  return schema
}

