// filepath: c:\www\quick-poll\server\api\polls\[id]\vote.post.ts
import { and, eq } from 'drizzle-orm'
import { getCookie, setCookie } from 'h3'
import { randomUUID } from 'crypto'

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export default defineEventHandler(async (event) => {
  const db = useDb()
  const schema = useDbSchema()

  const pollId = getRouterParam(event, 'id')
  if (!pollId || !isUuid(pollId)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid poll id' })
  }

  // Ensure poll exists and not closed
  const [poll] = await db.select().from(schema.polls).where(eq(schema.polls.id, pollId)).limit(1)
  if (!poll) {
    throw createError({ statusCode: 404, statusMessage: 'Poll not found' })
  }
  if (poll.closedAt) {
    throw createError({ statusCode: 409, statusMessage: 'This poll is closed and no longer accepts votes.' })
  }

  const body = await readBody<{ optionId?: string }>(event)
  const optionId = (body.optionId ?? '').trim()
  if (!optionId || !isUuid(optionId)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid option id' })
  }

  // Validate option belongs to poll
  const [opt] = await db
    .select({ id: schema.pollOptions.id })
    .from(schema.pollOptions)
    .where(and(eq(schema.pollOptions.id, optionId), eq(schema.pollOptions.pollId, pollId)))
    .limit(1)
  if (!opt) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid option for this poll' })
  }

  // Anonymous voter token
  let voterToken = getCookie(event, 'qp_voter') || ''
  if (!voterToken) {
    voterToken = randomUUID()
    // 180 days expiry
    setCookie(event, 'qp_voter', voterToken, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 180, path: '/' })
  }

  // Enforce one vote per token per poll
  const existing = await db
    .select({ id: schema.pollVotes.id })
    .from(schema.pollVotes)
    .where(and(eq(schema.pollVotes.pollId, pollId), eq(schema.pollVotes.voterToken, voterToken)))
    .limit(1)
  if (existing.length) {
    throw createError({ statusCode: 409, statusMessage: "You've already voted on this poll" })
  }

  await db.insert(schema.pollVotes).values({ pollId, optionId, voterToken, userId: null })

  return { ok: true }
})
