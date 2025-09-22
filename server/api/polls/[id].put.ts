// filepath: c:\www\quick-poll\server\api\polls\[id].put.ts
import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export default defineEventHandler(async (event) => {
  const db = useDb()
  const schema = useDbSchema()
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !isUuid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid poll id' })
  }

  const [poll] = await db.select().from(schema.polls).where(eq(schema.polls.id, id)).limit(1)
  if (!poll) {
    throw createError({ statusCode: 404, statusMessage: 'Poll not found' })
  }
  if (poll.authorId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody<{ title?: string; description?: string | null }>(event)
  const updates: { title?: string; description?: string | null } = {}
  if (typeof body.title === 'string') {
    const t = body.title.trim()
    if (!t) throw createError({ statusCode: 400, statusMessage: 'Title cannot be empty' })
    updates.title = t
  }
  if (typeof body.description === 'string') {
    const d = body.description.trim()
    updates.description = d || null
  } else if (body.description === null) {
    updates.description = null
  }

  if (Object.keys(updates).length === 0) {
    // nothing to update; return current
    return { id: poll.id, title: poll.title, description: poll.description }
  }

  const [updated] = await db
    .update(schema.polls)
    .set(updates)
    .where(eq(schema.polls.id, id))
    .returning({ id: schema.polls.id, title: schema.polls.title, description: schema.polls.description })

  return updated
})

