import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ title?: string; description?: string | null; options?: string[] }>(event)
  const title = (body.title ?? '').trim()
  const description = (body.description ?? '')?.trim() || null
  const options = (body.options ?? []).map((o) => o.trim()).filter(Boolean)

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }
  if (options.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Provide at least two options' })
  }

  const db = useDb()
  const schema = useDbSchema()

  const [poll] = await db
    .insert(schema.polls)
    .values({ title, description, authorId: user.id })
    .returning()

  const values = options.map((text, idx) => ({ pollId: poll.id, text, position: idx }))
  await db.insert(schema.pollOptions).values(values)

  return { id: poll.id }
})

