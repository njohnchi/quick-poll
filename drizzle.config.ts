import 'dotenv/config'

export default {
  schema: './server/db/drizzle-schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql' as const,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
}

