// filepath: c:\www\quick-poll\server\api\polls\[id]\vote.post.ts
import { serverSupabaseUser } from '#supabase/server'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const pollId = getRouterParam(event, 'id')
  if (!pollId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing poll id' })
  }

  const body = await readBody<{ optionId?: string }>(event)
  const optionId = (body.optionId ?? '').trim()
  if (!optionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing option id' })
  }

  const db = useDb()
  const schema = useDbSchema()

  // Validate option belongs to poll
  const [opt] = await db
    .select({ id: schema.pollOptions.id })
    .from(schema.pollOptions)
    .where(and(eq(schema.pollOptions.id, optionId), eq(schema.pollOptions.pollId, pollId)))
    .limit(1)
  if (!opt) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid option for this poll' })
  }

  // Ensure the user hasn't voted for this poll yet
  const already = await db
    .select({ id: schema.pollVotes.id })
    .from(schema.pollVotes)
    .where(and(eq(schema.pollVotes.pollId, pollId), eq(schema.pollVotes.userId, user.id)))
    .limit(1)
  if (already.length) {
    throw createError({ statusCode: 409, statusMessage: "You've already voted on this poll" })
  }

  await db.insert(schema.pollVotes).values({ pollId, optionId, userId: user.id })

  return { ok: true }
})

