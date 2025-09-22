// filepath: c:\www\quick-poll\server\api\polls.get.ts
import { asc, desc, inArray } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()
  const schema = useDbSchema()

  // Fetch latest polls (newest first)
  const polls = await db.select().from(schema.polls).orderBy(desc(schema.polls.createdAt))
  // Get all options for those polls
  const pollIds = polls.map((p) => p.id)
  let optionsByPoll = new Map<string, { id: string; text: string; position: number }[]>()
  if (pollIds.length) {
    const options = await db
      .select({ id: schema.pollOptions.id, text: schema.pollOptions.text, pollId: schema.pollOptions.pollId, position: schema.pollOptions.position })
      .from(schema.pollOptions)
      .where(inArray(schema.pollOptions.pollId, pollIds))
      .orderBy(asc(schema.pollOptions.pollId), asc(schema.pollOptions.position))

    for (const opt of options) {
      const arr = optionsByPoll.get(opt.pollId) || []
      arr.push({ id: opt.id, text: opt.text, position: opt.position })
      optionsByPoll.set(opt.pollId, arr)
    }
  }

  return polls.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    authorId: p.authorId,
    createdAt: p.createdAt,
    closedAt: p.closedAt,
    options: (optionsByPoll.get(p.id) || []).map((o) => ({ id: o.id, text: o.text })),
  }))
})
