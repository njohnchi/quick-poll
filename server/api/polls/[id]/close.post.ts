// filepath: c:\www\quick-poll\server\api\polls\[id]\close.post.ts
import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { useRealtimeHub } from '../../../utils/realtime'

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
  if (poll.closedAt) {
    return { id: poll.id, closedAt: poll.closedAt }
  }

  const [updated] = await db
    .update(schema.polls)
    .set({ closedAt: new Date() })
    .where(eq(schema.polls.id, id))
    .returning({ id: schema.polls.id, closedAt: schema.polls.closedAt })

  const hub = useRealtimeHub()
  hub.broadcast({ type: 'poll-closed', pollId: id, closedAt: String(updated.closedAt) })

  return updated
})
