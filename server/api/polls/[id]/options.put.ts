// filepath: c:\www\quick-poll\server\api\polls\[id]\options.put.ts
import { serverSupabaseUser } from '#supabase/server'
import { and, asc, eq, inArray } from 'drizzle-orm'

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

type IncomingOption = { id?: string; text?: string; position?: number }

export default defineEventHandler(async (event) => {
  const db = useDb()
  const schema = useDbSchema()
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const pollId = getRouterParam(event, 'id')
  if (!pollId || !isUuid(pollId)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid poll id' })
  }

  const [poll] = await db.select().from(schema.polls).where(eq(schema.polls.id, pollId)).limit(1)
  if (!poll) {
    throw createError({ statusCode: 404, statusMessage: 'Poll not found' })
  }
  if (poll.authorId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  if (poll.closedAt) {
    throw createError({ statusCode: 409, statusMessage: 'Poll is closed' })
  }

  const body = await readBody<{ options?: IncomingOption[] }>(event)
  const rawOptions = body.options || []

  // Normalize/validate
  const cleaned = rawOptions
    .map((o) => ({ id: o.id, text: (o.text || '').trim() }))
    .filter((o) => o.text.length > 0)

  if (cleaned.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Provide at least two options' })
  }

  // Load existing options for this poll
  const existing = await db
    .select({ id: schema.pollOptions.id, text: schema.pollOptions.text })
    .from(schema.pollOptions)
    .where(eq(schema.pollOptions.pollId, pollId))
    .orderBy(asc(schema.pollOptions.position))

  const existingIds = new Set(existing.map((o) => o.id))
  const incomingIds = new Set(cleaned.map((o) => o.id).filter(Boolean) as string[])

  // Validate that any provided ids belong to this poll
  for (const id of incomingIds) {
    if (!existingIds.has(id)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid option id for this poll' })
    }
  }

  // Reindex positions based on provided order
  const ordered = cleaned.map((o, idx) => ({ ...o, position: idx }))

  // Partition updates vs inserts
  const toUpdate = ordered.filter((o) => o.id)
  const toInsert = ordered.filter((o) => !o.id)

  // Compute deletions (anything existing but not provided)
  const toDeleteIds = [...existingIds].filter((id) => !incomingIds.has(id))

  // Apply changes (transaction for atomicity)
  await db.transaction(async (tx) => {
    if (toDeleteIds.length) {
      await tx.delete(schema.pollOptions).where(and(eq(schema.pollOptions.pollId, pollId), inArray(schema.pollOptions.id, toDeleteIds)))
    }
    for (const u of toUpdate) {
      await tx
        .update(schema.pollOptions)
        .set({ text: u.text!, position: u.position! })
        .where(and(eq(schema.pollOptions.id, u.id!), eq(schema.pollOptions.pollId, pollId)))
    }
    if (toInsert.length) {
      await tx.insert(schema.pollOptions).values(toInsert.map((o) => ({ pollId, text: o.text!, position: o.position! })))
    }
  })

  // Return updated set
  const updated = await db
    .select({ id: schema.pollOptions.id, text: schema.pollOptions.text, position: schema.pollOptions.position })
    .from(schema.pollOptions)
    .where(eq(schema.pollOptions.pollId, pollId))
    .orderBy(asc(schema.pollOptions.position))

  return { options: updated }
})
