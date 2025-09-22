export default defineTask({
  meta: {
    name: 'seed:polls',
    description: 'Seed sample poll and options',
  },
  async run() {
    const db = useDb()
    const schema = useDbSchema()

    const [poll] = await db
      .insert(schema.polls)
      .values({
        title: 'Your favorite frontend framework?',
        description: 'Vote now!',
        authorId: '00000000-0000-0000-0000-000000000000', // TODO: replace with a real user id
      })
      .returning()

    await db.insert(schema.pollOptions).values([
      { pollId: poll.id, text: 'Vue', position: 0 },
      { pollId: poll.id, text: 'React', position: 1 },
      { pollId: poll.id, text: 'Svelte', position: 2 },
    ])

    return { result: 'Success', pollId: poll.id }
  },
})

