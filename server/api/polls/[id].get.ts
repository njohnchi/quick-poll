// filepath: c:\www\quick-poll\server\api\polls\[id].get.ts
import { asc, eq, count } from 'drizzle-orm'

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export default defineEventHandler(async (event) => {
  const db = useDb()
  const schema = useDbSchema()
  const id = getRouterParam(event, 'id')

  if (!id || !isUuid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid poll id' })
  }

  const [poll] = await db.select().from(schema.polls).where(eq(schema.polls.id, id)).limit(1)
  if (!poll) {
    throw createError({ statusCode: 404, statusMessage: 'Poll not found' })
  }

  const options = await db
    .select({ id: schema.pollOptions.id, text: schema.pollOptions.text, position: schema.pollOptions.position })
    .from(schema.pollOptions)
    .where(eq(schema.pollOptions.pollId, id))
    .orderBy(asc(schema.pollOptions.position))

  // Aggregate votes per option
  const voteCounts = await db
    .select({ optionId: schema.pollVotes.optionId, votes: count() })
    .from(schema.pollVotes)
    .where(eq(schema.pollVotes.pollId, id))
    .groupBy(schema.pollVotes.optionId)

  const votesMap = new Map<string, number>()
  for (const v of voteCounts) votesMap.set(v.optionId, Number(v.votes))

  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    authorId: poll.authorId,
    createdAt: poll.createdAt,
    closedAt: poll.closedAt,
    options: options.map((o) => ({ id: o.id, text: o.text, votes: votesMap.get(o.id) ?? 0 })),
  }
})
